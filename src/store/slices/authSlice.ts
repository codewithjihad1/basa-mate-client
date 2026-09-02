import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types/api";
import { authApi } from "@/store/api/endpoints/authApi";
import { clearSession, setAccessToken } from "./authActions";

/**
 * Session state.
 *
 * The access token is held **in memory only**. It is deliberately not persisted:
 * `localStorage` is readable by any injected script, and the refresh token already
 * lives in an HttpOnly cookie that survives a reload (frontend-requirements §32).
 * `status` drives the boot splash while we work out whether that cookie is still good.
 *
 * Import `authApi` from its own module, never from `@/store/api/endpoints` — the
 * barrel pulls in every endpoint file and widens the import cycle this slice already
 * sits on the edge of.
 */
export type AuthStatus = "idle" | "authenticating" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "unauthenticated";
    },
    /** Marks the boot check as finished with no session. */
    setUnauthenticated(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "unauthenticated";
    },
  },
  extraReducers: (builder) => {
    builder
      // Dispatched by `baseQuery`; defined in `authActions` to break the import cycle.
      .addCase(setAccessToken, (state, action) => {
        state.accessToken = action.payload;
      })
      .addCase(clearSession, () => ({ ...initialState, status: "unauthenticated" as const }))
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
        state.accessToken = payload.tokens.accessToken;
        state.status = "authenticated";
      })
      .addMatcher(authApi.endpoints.register.matchFulfilled, (state, { payload }) => {
        state.accessToken = payload.tokens.accessToken;
        state.status = "authenticated";
      })
      .addMatcher(authApi.endpoints.refresh.matchFulfilled, (state, { payload }) => {
        state.accessToken = payload.tokens.accessToken;
      })
      .addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, { payload }) => {
        state.user = payload;
        state.status = "authenticated";
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, () => ({
        ...initialState,
        status: "unauthenticated" as const,
      }));
  },
});

export const { setUser, setUnauthenticated } = authSlice.actions;
// Re-exported so callers have a single place to import auth actions from.
export { setAccessToken, clearSession };
export default authSlice.reducer;
