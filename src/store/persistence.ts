import type { Middleware } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "@/config/constants";
import type { BasaId } from "@/types/api";
import { setActiveBasa } from "@/store/slices/workspaceSlice";

/**
 * The only thing we persist is the active basa id, so a reload lands the user back
 * on the workspace they were using. Tokens, roles and any financial data stay out of
 * `localStorage` (frontend-requirements §32) — the id alone grants nothing, because
 * the server re-checks membership on every basa-scoped request.
 */

export function readPersistedBasaId(): BasaId | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.activeBasaId);
  } catch {
    // Private browsing or a disabled storage partition — fall back to no preference.
    return null;
  }
}

export const persistenceMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  if (setActiveBasa.match(action) && typeof window !== "undefined") {
    try {
      if (action.payload) {
        window.localStorage.setItem(STORAGE_KEYS.activeBasaId, action.payload);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.activeBasaId);
      }
    } catch {
      // Persisting the preference is best-effort; never break the dispatch over it.
    }
  }

  return result;
};
