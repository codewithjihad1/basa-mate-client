import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { Mutex } from "@/lib/api/mutex";
import { API_BASE_URL } from "@/config/env";
import type { RootState } from "@/store";
import { clearSession, setAccessToken } from "@/store/slices/authActions";

/**
 * One `fetchBaseQuery` for the whole app.
 *
 * Auth follows the API's dual scheme (docs/API.md §Authentication):
 *  - `credentials: "include"` sends the HttpOnly `accessToken`/`refreshToken` cookies.
 *  - When we also hold an access token in memory we send it as a Bearer header, which
 *    the server prefers over the cookie.
 *
 * The access token lives in Redux only — never in `localStorage` — so an XSS payload
 * cannot read it, and roles are always re-read from the server (frontend-requirements §32).
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

/** Serializes concurrent 401s so only one refresh request is ever in flight. */
const refreshMutex = new Mutex();

interface RefreshResponse {
  success: true;
  data: { tokens: { accessToken: string; refreshToken: string; expiresIn: number } };
}

/**
 * Unwraps the `{ success, data, message }` envelope so endpoints receive `data`
 * directly, and transparently refreshes an expired access token once per 401.
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await refreshMutex.waitForUnlock();

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isAuthRoute(args)) {
    if (!refreshMutex.isLocked()) {
      const release = await refreshMutex.acquire();
      try {
        const refresh = await rawBaseQuery(
          { url: "/auth/refresh", method: "POST", body: {} },
          api,
          extraOptions,
        );

        const tokens = (refresh.data as RefreshResponse | undefined)?.data?.tokens;
        if (tokens?.accessToken) {
          api.dispatch(setAccessToken(tokens.accessToken));
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          api.dispatch(clearSession());
        }
      } finally {
        release();
      }
    } else {
      // Another request is refreshing; wait for it and retry once.
      await refreshMutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  if (result.data && typeof result.data === "object" && "success" in result.data) {
    const envelope = result.data as { success: boolean; data: unknown };
    if (envelope.success) return { ...result, data: envelope.data };
  }

  return result;
};

/** Refreshing on a failed auth call would loop; those 401s are terminal. */
function isAuthRoute(args: string | FetchArgs): boolean {
  const url = typeof args === "string" ? args : args.url;
  return url.startsWith("/auth/login") || url.startsWith("/auth/refresh") || url.startsWith("/auth/register");
}
