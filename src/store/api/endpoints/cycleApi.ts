import { apiSlice } from "../apiSlice";
import type {
  BasaId,
  BillingCycle,
  CreateCycleInput,
  CycleDashboard,
  CycleId,
  Paginated,
  PaginationParams,
} from "@/types/api";

type CycleScope = { basaId: BasaId; cycleId: CycleId };

export const cycleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listCycles: builder.query<Paginated<BillingCycle>, { basaId: BasaId } & PaginationParams>({
      query: ({ basaId, ...params }) => ({ url: `/basas/${basaId}/cycles`, params }),
      providesTags: (_r, _e, { basaId }) => [{ type: "Cycle", id: basaId }],
    }),

    getCycle: builder.query<BillingCycle, CycleScope>({
      query: ({ basaId, cycleId }) => `/basas/${basaId}/cycles/${cycleId}`,
      providesTags: (_r, _e, { cycleId }) => [{ type: "Cycle", id: cycleId }],
    }),

    /** Cycle totals for the dashboard. `mealRate` is 0 until a settlement exists. */
    getCycleDashboard: builder.query<CycleDashboard, CycleScope>({
      query: ({ basaId, cycleId }) => `/basas/${basaId}/cycles/${cycleId}/dashboard`,
      providesTags: (_r, _e, { cycleId }) => [{ type: "CycleDashboard", id: cycleId }],
    }),

    createCycle: builder.mutation<BillingCycle, { basaId: BasaId } & CreateCycleInput>({
      query: ({ basaId, ...body }) => ({ url: `/basas/${basaId}/cycles`, method: "POST", body }),
      invalidatesTags: (_r, _e, { basaId }) => [{ type: "Cycle", id: basaId }],
    }),

    /** Locks the cycle. Meals, expenses and deposits become read-only. */
    closeCycle: builder.mutation<BillingCycle, CycleScope>({
      query: ({ basaId, cycleId }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/close`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [
        { type: "Cycle", id: basaId },
        { type: "Cycle", id: cycleId },
        { type: "CycleDashboard", id: cycleId },
        { type: "Settlement", id: cycleId },
      ],
    }),

    /** `reason` is required (3–500 chars) even though the server currently discards it. */
    reopenCycle: builder.mutation<BillingCycle, CycleScope & { reason: string }>({
      query: ({ basaId, cycleId, reason }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/reopen`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [
        { type: "Cycle", id: basaId },
        { type: "Cycle", id: cycleId },
        { type: "CycleDashboard", id: cycleId },
        { type: "Settlement", id: cycleId },
      ],
    }),
  }),
});

export const {
  useListCyclesQuery,
  useGetCycleQuery,
  useGetCycleDashboardQuery,
  useCreateCycleMutation,
  useCloseCycleMutation,
  useReopenCycleMutation,
} = cycleApi;
