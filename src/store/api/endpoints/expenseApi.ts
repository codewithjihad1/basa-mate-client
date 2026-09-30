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
import { apiSlice, OVERRIDE_ON_HMR } from "../apiSlice";

type CycleScope = { basaId: BasaId; cycleId: CycleId };

const expenseWriteTags = (basaId: BasaId, cycleId: CycleId) =>
    [
        { type: "Expense" as const, id: cycleId },
        { type: "CycleDashboard" as const, id: cycleId },
        { type: "Cycle" as const, id: basaId },
    ] as const;

export const expenseApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listExpenses: builder.query<
            Paginated<Expense>,
            CycleScope & ExpenseListParams
        >({
            query: (arg) => ({
                url: `/basas/${arg.basaId}/cycles/${arg.cycleId}/expenses`,
                params: {
                    from: arg.from,
                    to: arg.to,
                    categoryId: arg.categoryId,
                    paidBy: arg.paidBy,
                    type: arg.type,
                    search: arg.search,
                    status: arg.status,
                    minAmount: arg.minAmount,
                    maxAmount: arg.maxAmount,
                    page: arg.page,
                    limit: arg.limit,
                },
            }),
            transformResponse: (
                response: Paginated<Expense> | Expense[],
                _meta,
                arg: CycleScope & ExpenseListParams,
            ) => {
                if (!Array.isArray(response)) return response;

                return paginateClientSide(
                    response,
                    arg.page ?? 1,
                    arg.limit ?? DEFAULT_PAGE_SIZE,
                );
            },
            providesTags: (_r, _e, { cycleId }) => [
                { type: "Expense", id: cycleId },
            ],
        }),

        getExpense: builder.query<Expense, CycleScope & { expenseId: string }>({
            query: ({ basaId, cycleId, expenseId }) =>
                `/basas/${basaId}/cycles/${cycleId}/expenses/${expenseId}`,
            providesTags: (_r, _e, { expenseId }) => [
                { type: "Expense", id: expenseId },
            ],
        }),

        createExpense: builder.mutation<
            Expense,
            CycleScope & CreateExpenseInput
        >({
            query: ({ basaId, cycleId, ...body }) => ({
                url: `/basas/${basaId}/cycles/${cycleId}/expenses`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, { basaId, cycleId }) => [
                ...expenseWriteTags(basaId, cycleId),
            ],
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

        deleteExpense: builder.mutation<
            { id: string },
            CycleScope & { expenseId: string }
        >({
            query: ({ basaId, cycleId, expenseId }) => ({
                url: `/basas/${basaId}/cycles/${cycleId}/expenses/${expenseId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, { basaId, cycleId }) => [
                ...expenseWriteTags(basaId, cycleId),
            ],
        }),

        /** OWNER/MANAGER review: approve a `PENDING` expense (docs/API.md §approve). */
        reviewExpense: builder.mutation<
            Expense,
            CycleScope & { expenseId: string; action: "approve" | "reject" }
        >({
            query: ({ basaId, cycleId, expenseId, action }) => ({
                url: `/basas/${basaId}/cycles/${cycleId}/expenses/${expenseId}/${action}`,
                method: "POST",
            }),
            invalidatesTags: (_r, _e, { basaId, cycleId, expenseId }) => [
                ...expenseWriteTags(basaId, cycleId),
                { type: "Expense", id: expenseId },
                "Notification",
            ],
        }),
    }),
    overrideExisting: OVERRIDE_ON_HMR,
});

function paginateClientSide<T>(
    items: T[],
    page: number,
    limit: number,
): Paginated<T> {
    const total = items.length;
    const start = (page - 1) * limit;
    return {
        items: items.slice(start, start + limit),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}

export const {
    useListExpensesQuery,
    useGetExpenseQuery,
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
    useReviewExpenseMutation,
} = expenseApi;
