import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types/api";
import { authApi } from "@/store/api/endpoints/authApi";

/**
 * Session state.
 *
 * The access token is held **in memory only**. It is deliberately not persisted:
 * `localStorage` is readable by any injected script, and the refresh token already
 * lives in an HttpOnly cookie that survives a reload (frontend-requirements §32).
 * `status` drives the boot splash while we work out whether that cookie is still good.
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
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
    },
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
    clearSession() {
      return { ...initialState, status: "unauthenticated" as const };
    },
  },
  extraReducers: (builder) => {
    builder
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

export const { setAccessToken, setUser, setUnauthenticated, clearSession } = authSlice.actions;
export default authSlice.reducer;
