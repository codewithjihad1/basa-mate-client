"use client";

import { useMemo } from "react";
import { UtensilsCrossed } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { useListMealsQuery, useGetMealSummaryQuery } from "@/store/api/endpoints/mealApi";
import { parseMoney } from "@/lib/utils/money";
import type { BasaId, CycleId } from "@/types/api";

/**
 * Per-roommate meal totals broken down by meal type (frontend-requirements §10.4).
 *
 * `GET /meals/summary` only gives a per-member total, so the per-type columns are
 * aggregated from the meal list — which is unpaginated and cycle-scoped, so it is
 * the whole cycle rather than a page of it.
 */
export function MealSummaryTable() {
  const { basaId, members, mealTypes } = useActiveBasa();
  const { cycleId } = useActiveCycle();

  const scope = { basaId: basaId as BasaId, cycleId: cycleId as CycleId };
  const skip = !basaId || !cycleId;

  const summaryQuery = useGetMealSummaryQuery(scope, { skip });
  const mealsQuery = useListMealsQuery(scope, { skip });

  const rows = useMemo(() => {
    const byMember = new Map<string, Record<string, number>>();

    (mealsQuery.data ?? []).forEach((meal) => {
      const perType = byMember.get(meal.memberId) ?? {};
      perType[meal.mealTypeId] = (perType[meal.mealTypeId] ?? 0) + parseMoney(meal.quantity);
      byMember.set(meal.memberId, perType);
    });

    return members.map((member) => {
      const perType = byMember.get(member.id) ?? {};
      const total = Object.values(perType).reduce((sum, value) => sum + value, 0);
      return { member, perType, total };
    });
  }, [mealsQuery.data, members]);

  const grandTotal = summaryQuery.data?.totalMeals ?? rows.reduce((sum, row) => sum + row.total, 0);

  if (summaryQuery.error) {
    return <ErrorState error={summaryQuery.error} title="Couldn't load the meal summary" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Meal summary</CardTitle>
      </CardHeader>
      <CardContent>
        {summaryQuery.isLoading || mealsQuery.isLoading ? (
          <TableSkeleton columns={mealTypes.length + 2} />
        ) : grandTotal === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No meals recorded yet."
            description="Meals logged this cycle will be totalled here."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Roommate</TableHead>
                {mealTypes.map((type) => (
                  <TableHead key={type.id} scope="col" className="text-right">
                    {type.name}
                  </TableHead>
                ))}
                <TableHead scope="col" className="text-right">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ member, perType, total }) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.user?.name ?? "Unknown"}</TableCell>
                  {mealTypes.map((type) => (
                    <TableCell key={type.id} className="text-right tabular">
                      {perType[type.id] ?? 0}
                    </TableCell>
                  ))}
                  <TableCell className="text-right tabular font-semibold">{total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>All roommates</TableCell>
                {mealTypes.map((type) => (
                  <TableCell key={type.id} className="text-right tabular">
                    {rows.reduce((sum, row) => sum + (row.perType[type.id] ?? 0), 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular">{grandTotal}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
