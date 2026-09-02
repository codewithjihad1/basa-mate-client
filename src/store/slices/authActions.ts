import { createAction } from "@reduxjs/toolkit";

/**
 * Auth actions defined standalone, with no imports of their own.
 *
 * `baseQuery` has to dispatch these when a refresh succeeds or fails, but it cannot
 * import `authSlice` — that slice matches on `authApi`'s endpoints, and `authApi` is
 * injected into the `apiSlice` that `baseQuery` itself belongs to. Importing the
 * slice from `baseQuery` closes that loop and the module graph deadlocks
 * ("Cannot access 'apiSlice' before initialization").
 *
 * Keeping the two actions `baseQuery` needs in this leaf module breaks the cycle:
 * `baseQuery` depends on nothing, and `authSlice` handles them in `extraReducers`.
 */
export const setAccessToken = createAction<string | null>("auth/setAccessToken");
export const clearSession = createAction("auth/clearSession");
