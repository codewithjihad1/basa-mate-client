/**
 * Public runtime configuration.
 *
 * Only `NEXT_PUBLIC_*` values belong here — anything else would be inlined into
 * the client bundle. Secrets must never appear in this file (frontend-requirements §32).
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const env = {
  /** Origin of the BasaMate API, e.g. `http://localhost:4000` (no trailing slash). */
  apiUrl: rawApiUrl.replace(/\/+$/, ""),
  /** Version prefix mounted by the backend (`API_VERSION` in the server config). */
  apiPrefix: "/api/v1",
  appName: "BasaMate",
} as const;

/** Fully-qualified API base, e.g. `http://localhost:4000/api/v1`. */
export const API_BASE_URL = `${env.apiUrl}${env.apiPrefix}`;
