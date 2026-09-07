import { apiSlice, OVERRIDE_ON_HMR } from "../apiSlice";
import type {
  BasaId,
  CreateDepositInput,
  CycleId,
  Deposit,
  DepositListParams,
  UpdateDepositInput,
} from "@/types/api";

type CycleScope = { basaId: BasaId; cycleId: CycleId };

const depositWriteTags = (basaId: BasaId, cycleId: CycleId) =>
  [
    { type: "Deposit" as const, id: cycleId },
    { type: "CycleDashboard" as const, id: cycleId },
    { type: "Cycle" as const, id: basaId },
  ] as const;

export const depositApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** All non-deleted deposits in the cycle, newest first. Not paginated by the API. */
    listDeposits: builder.query<Deposit[], CycleScope & DepositListParams>({
      query: ({ basaId, cycleId, status }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/deposits`,
        params: { status },
      }),
      providesTags: (_r, _e, { cycleId }) => [{ type: "Deposit", id: cycleId }],
    }),

    /** ⚠️ `memberId` here is the **member id**, unlike `createMeal` (docs/API.md §IDs). */
    createDeposit: builder.mutation<Deposit, CycleScope & CreateDepositInput>({
      query: ({ basaId, cycleId, ...body }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/deposits`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [...depositWriteTags(basaId, cycleId)],
    }),

    updateDeposit: builder.mutation<
      Deposit,
      CycleScope & { depositId: string; body: UpdateDepositInput }
    >({
      query: ({ basaId, cycleId, depositId, body }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/deposits/${depositId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [...depositWriteTags(basaId, cycleId)],
    }),

    deleteDeposit: builder.mutation<{ id: string }, CycleScope & { depositId: string }>({
      query: ({ basaId, cycleId, depositId }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/deposits/${depositId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [...depositWriteTags(basaId, cycleId)],
    }),

    /** OWNER/MANAGER review: approve or reject a `PENDING` deposit (docs/API.md §approve). */
    reviewDeposit: builder.mutation<
      Deposit,
      CycleScope & { depositId: string; action: "approve" | "reject" }
    >({
      query: ({ basaId, cycleId, depositId, action }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/deposits/${depositId}/${action}`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [
        ...depositWriteTags(basaId, cycleId),
        "Notification",
      ],
    }),
  }),
  overrideExisting: OVERRIDE_ON_HMR,
});

export const {
  useListDepositsQuery,
  useCreateDepositMutation,
  useUpdateDepositMutation,
  useDeleteDepositMutation,
  useReviewDepositMutation,
} = depositApi;
