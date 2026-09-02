import { apiSlice, OVERRIDE_ON_HMR } from "../apiSlice";
import { API_BASE_URL } from "@/config/env";
import type { BasaId, CycleId, CycleReport, Settlement } from "@/types/api";

type CycleScope = { basaId: BasaId; cycleId: CycleId };

export const settlementApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Always read the settlement through the cycle-scoped route. The top-level
     * `GET /settlements/:id` routes are unusable (docs/API.md §Known gaps #2).
     */
    getSettlement: builder.query<Settlement, CycleScope>({
      query: ({ basaId, cycleId }) => `/basas/${basaId}/cycles/${cycleId}/settlement`,
      providesTags: (_r, _e, { cycleId }) => [{ type: "Settlement", id: cycleId }],
    }),

    /** Requires a **closed** cycle. Re-running replaces the previous settlement. */
    generateSettlement: builder.mutation<Settlement, CycleScope>({
      query: ({ basaId, cycleId }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/settlement/generate`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { cycleId }) => [
        { type: "Settlement", id: cycleId },
        { type: "CycleDashboard", id: cycleId },
        { type: "Report", id: cycleId },
      ],
    }),

    /** Irreversible from the UI: after this only a cycle reopen can change the numbers. */
    finalizeSettlement: builder.mutation<Settlement, CycleScope>({
      query: ({ basaId, cycleId }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/settlement/finalize`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { cycleId }) => [
        { type: "Settlement", id: cycleId },
        { type: "Cycle", id: cycleId },
        { type: "Report", id: cycleId },
      ],
    }),

    getReport: builder.query<CycleReport, CycleScope>({
      query: ({ basaId, cycleId }) => `/basas/${basaId}/cycles/${cycleId}/report`,
      providesTags: (_r, _e, { cycleId }) => [{ type: "Report", id: cycleId }],
    }),
  }),
  overrideExisting: OVERRIDE_ON_HMR,
});

/**
 * The CSV report returns raw text, not the success envelope, so it bypasses RTK
 * Query and is fetched directly. Cookies are included the same way `baseQuery` does.
 */
export function csvReportUrl(basaId: BasaId, cycleId: CycleId): string {
  return `${API_BASE_URL}/basas/${basaId}/cycles/${cycleId}/report/csv`;
}

export async function downloadCsvReport(
  basaId: BasaId,
  cycleId: CycleId,
  accessToken: string | null,
): Promise<Blob> {
  const response = await fetch(csvReportUrl(basaId, cycleId), {
    credentials: "include",
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!response.ok) throw new Error("Could not download the CSV report.");
  return response.blob();
}

export const {
  useGetSettlementQuery,
  useGenerateSettlementMutation,
  useFinalizeSettlementMutation,
  useGetReportQuery,
} = settlementApi;
