import { apiSlice, OVERRIDE_ON_HMR } from "../apiSlice";
import type {
  BasaId,
  CreateMealInput,
  CycleId,
  MealEntry,
  MealListParams,
  MealSummary,
  UpdateMealInput,
} from "@/types/api";

type CycleScope = { basaId: BasaId; cycleId: CycleId };

/** Every meal write shifts the meal rate, so it invalidates the cycle summaries too. */
const mealWriteTags = (basaId: BasaId, cycleId: CycleId) =>
  [
    { type: "Meal" as const, id: cycleId },
    { type: "MealSummary" as const, id: cycleId },
    { type: "CycleDashboard" as const, id: cycleId },
    { type: "Cycle" as const, id: basaId },
  ] as const;

export const mealApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listMeals: builder.query<MealEntry[], CycleScope & MealListParams>({
      query: ({ basaId, cycleId, ...params }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/meals`,
        params,
      }),
      providesTags: (_r, _e, { cycleId }) => [{ type: "Meal", id: cycleId }],
    }),

    getMealSummary: builder.query<MealSummary, CycleScope>({
      query: ({ basaId, cycleId }) => `/basas/${basaId}/cycles/${cycleId}/meals/summary`,
      providesTags: (_r, _e, { cycleId }) => [{ type: "MealSummary", id: cycleId }],
    }),

    /**
     * Records meals for one member on one date. Returns `{ count }`, not the rows.
     * ⚠️ `memberId` here is the eater's **user id** (docs/API.md §IDs).
     */
    createMeal: builder.mutation<{ count: number }, CycleScope & CreateMealInput>({
      query: ({ basaId, cycleId, ...body }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/meals`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [...mealWriteTags(basaId, cycleId)],
    }),

    updateMeal: builder.mutation<MealEntry, CycleScope & { mealId: string } & UpdateMealInput>({
      query: ({ basaId, cycleId, mealId, ...body }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/meals/${mealId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [...mealWriteTags(basaId, cycleId)],
    }),

    deleteMeal: builder.mutation<{ id: string }, CycleScope & { mealId: string }>({
      query: ({ basaId, cycleId, mealId }) => ({
        url: `/basas/${basaId}/cycles/${cycleId}/meals/${mealId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { basaId, cycleId }) => [...mealWriteTags(basaId, cycleId)],
    }),
  }),
  overrideExisting: OVERRIDE_ON_HMR,
});

export const {
  useListMealsQuery,
  useGetMealSummaryQuery,
  useCreateMealMutation,
  useUpdateMealMutation,
  useDeleteMealMutation,
} = mealApi;
