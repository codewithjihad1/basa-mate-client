import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

/**
 * The single RTK Query API. Endpoints are added by the feature files in
 * `src/store/api/endpoints/*` via `injectEndpoints`, which keeps each domain's
 * endpoints next to its types while sharing one cache and one tag registry.
 *
 * Tags stand in for the query keys described in frontend-requirements §27; every
 * basa-scoped tag carries the basa (and usually cycle) id so switching the active
 * basa invalidates exactly the data that belongs to the old one.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "Basa",
    "BasaList",
    "Member",
    "Invitation",
    "Cycle",
    "CycleDashboard",
    "Meal",
    "MealSummary",
    "Expense",
    "Deposit",
    "Settlement",
    "Report",
    "Notification",
  ],
  // Financial data must not go stale silently; refetch when the user comes back.
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 30,
  endpoints: () => ({}),
});
