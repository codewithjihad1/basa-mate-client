import { apiSlice, OVERRIDE_ON_HMR } from "../apiSlice";
import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import type {
  BasaId,
  CreateExpenseInput,
  CycleId,
  Expense,
  ExpenseListParams,
  Paginated,
  UpdateExpenseInput,
} from "@/types/api";

type CycleScope = { basaId: BasaId; cycleId: CycleId };

const expenseWriteTags = (basaId: BasaId, cycleId: CycleId) =>
  [
    { type: "Expense" as const, id: cycleId },
    { type: "CycleDashboard" as const, id: cycleId },
    { type: "Cycle" as const, id: basaId },
  ] as const;

export const expenseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * ⚠️ Server-side pagination on this endpoint returns `500` today: the validation
     * middleware's coerced `page`/`limit` are discarded by Express 5's re-parsing
     * `req.query` getter, so Prisma receives `take: "20"` (docs/API.md §Known gaps #1).
     *
     * Omitting both params avoids the bug entirely — Prisma then gets `undefined` and
     * returns the whole cycle, which we page through on the client. A cycle holds at
     * most a month of expenses, so the payload stays small. Once the middleware is
     * fixed, forward `page`/`limit` and drop `paginateClientSide`.
     */
    listExpenses: builder.query<Paginated<Expense>, CycleScope & ExpenseListParams>({
      query: (arg) => ({
        url: `/basas/${arg.basaId}/cycles/${arg.cycleId}/expenses`,
        // `page`/`limit` are deliberately not forwarded — see the note above.
        params: {
          from: arg.from,
          to: arg.to,
          categoryId: arg.categoryId,
          paidBy: arg.paidBy,
          type: arg.type,
          search: arg.search,
          minAmount: arg.minAmount,
          maxAmount: arg.maxAmount,
        },
      }),
      transformResponse: (
        response: Paginated<Expense> | Expense[],
        _meta,
        arg: CycleScope & ExpenseListParams,
      ) => {
        const items = Array.isArray(response) ? response : (response?.items ?? []);
        return paginateClientSide(items, arg.page ?? 1, arg.limit ?? DEFAULT_PAGE_SIZE);
      },
      providesTags: (_r, _e, { cycleId }) => [{ type: "Expense", id: cycleId }],
    }),

    getExpense: builder.query<Expense, CycleScope & { expenseId: string }>({
      query: ({ basaId, cycleId, expenseId }) =>
        `/basas/${basaId}/cycles/${cycleId}/expenses/${expenseId}`,
      providesTags: (_r, _e, { expenseId }) => [{ type: "Expense", id: expenseId }],
    }),

    createExpense: builder.mutation<Expense, CycleScope & CreateExpenseInput>({
      query: ({ basaId, cycleId, ...body }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/expenses`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [...expenseWriteTags(basaId, cycleId)],
    }),

    /** Sending `allocations` replaces the entire allocation set on the server. */
    updateExpense: builder.mutation<
      Expense,
      CycleScope & { expenseId: string; body: UpdateExpenseInput }
    >({
      query: ({ basaId, cycleId, expenseId, body }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/expenses/${expenseId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId, expenseId }) => [
        ...expenseWriteTags(basaId, cycleId),
        { type: "Expense", id: expenseId },
      ],
    }),

    deleteExpense: builder.mutation<{ id: string }, CycleScope & { expenseId: string }>({
      query: ({ basaId, cycleId, expenseId }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/expenses/${expenseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [...expenseWriteTags(basaId, cycleId)],
    }),
  }),
  overrideExisting: OVERRIDE_ON_HMR,
});

function paginateClientSide<T>(items: T[], page: number, limit: number): Paginated<T> {
  const total = items.length;
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export const {
  useListExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;
