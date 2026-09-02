"use client";

import { ExpenseForm } from "./ExpenseForm";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/common/ErrorState";
import { FormSkeleton } from "@/components/common/LoadingSkeleton";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { useGetExpenseQuery } from "@/store/api/endpoints/expenseApi";
import type { BasaId, CycleId, ExpenseType } from "@/types/api";

/**
 * Loads one expense, then hands it to the shared form.
 *
 * The form's default values are built from the loaded expense, so it must not mount
 * until the data is here — remounting with new defaults would discard user edits.
 */
export function EditExpenseView({
  expenseId,
  type,
  redirectTo,
}: {
  expenseId: string;
  type: ExpenseType;
  redirectTo: string;
}) {
  const { basaId } = useActiveBasa();
  const { cycleId } = useActiveCycle();

  const { data, isLoading, error, refetch } = useGetExpenseQuery(
    { basaId: basaId as BasaId, cycleId: cycleId as CycleId, expenseId },
    { skip: !basaId || !cycleId },
  );

  if (error) return <ErrorState error={error} title="Couldn't load this expense" onRetry={refetch} />;

  return (
    <Card>
      <CardContent className="pt-5">
        {isLoading || !data ? (
          <FormSkeleton fields={5} />
        ) : (
          <ExpenseForm type={type} expense={data} redirectTo={redirectTo} />
        )}
      </CardContent>
    </Card>
  );
}
