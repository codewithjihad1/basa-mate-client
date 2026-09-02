"use client";

import { useState } from "react";
import { Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangePicker, type DateRange } from "@/components/common/DateRangePicker";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteMealMutation, useListMealsQuery } from "@/store/api/endpoints/mealApi";
import { formatDate } from "@/lib/utils/date";
import { formatQuantity } from "@/lib/utils/money";
import { getErrorMessage } from "@/lib/api/errors";
import type { BasaId, CycleId, MealEntry } from "@/types/api";

const ALL = "__all__";

/**
 * Filterable meal history (frontend-requirements §10.3).
 *
 * A plain MEMBER can only delete their own rows — the same rule the server applies,
 * mirrored here so the button isn't offered where it would fail.
 */
export function MealHistoryTable() {
  const { basaId, members, mealTypes } = useActiveBasa();
  const { cycleId, isClosed } = useActiveCycle();
  const { canEditOthersMeals } = usePermissions();
  const { user } = useAuth();

  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [memberId, setMemberId] = useState<string>(ALL);
  const [mealTypeId, setMealTypeId] = useState<string>(ALL);
  const [pendingDelete, setPendingDelete] = useState<MealEntry | null>(null);

  const [deleteMeal] = useDeleteMealMutation();

  const { data, isLoading, isFetching, error, refetch } = useListMealsQuery(
    {
      basaId: basaId as BasaId,
      cycleId: cycleId as CycleId,
      from: range.from || undefined,
      to: range.to || undefined,
      // The list filter takes the **member id**, unlike the create payload.
      memberId: memberId === ALL ? undefined : memberId,
      mealTypeId: mealTypeId === ALL ? undefined : mealTypeId,
    },
    { skip: !basaId || !cycleId },
  );

  const ownMemberId = members.find((member) => member.userId === user?.id)?.id;

  const canDelete = (meal: MealEntry) =>
    !isClosed && (canEditOthersMeals || meal.memberId === ownMemberId);

  const handleDelete = async (meal: MealEntry) => {
    try {
      await deleteMeal({
        basaId: basaId as BasaId,
        cycleId: cycleId as CycleId,
        mealId: meal.id,
      }).unwrap();
      toast.success("Meal deleted");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  const meals = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Meal history</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <DateRangePicker value={range} onChange={setRange} idPrefix="meals" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="meal-member">Roommate</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger id="meal-member">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Everyone</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.user?.name ?? "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="meal-type">Meal type</Label>
              <Select value={mealTypeId} onValueChange={setMealTypeId}>
                <SelectTrigger id="meal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All types</SelectItem>
                  {mealTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error ? (
          <ErrorState error={error} title="Couldn't load meals" onRetry={refetch} />
        ) : isLoading ? (
          <TableSkeleton columns={5} />
        ) : meals.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No meals match these filters"
            description="Try widening the date range or clearing the roommate filter."
            className="border-0"
          />
        ) : (
          <div aria-busy={isFetching}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Date</TableHead>
                  <TableHead scope="col">Roommate</TableHead>
                  <TableHead scope="col">Meal</TableHead>
                  <TableHead scope="col" className="text-right">
                    Quantity
                  </TableHead>
                  <TableHead scope="col" className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meals.map((meal) => (
                  <TableRow key={meal.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(meal.date)}</TableCell>
                    <TableCell>{meal.member?.user?.name ?? "Unknown"}</TableCell>
                    <TableCell>{meal.mealType?.name ?? "—"}</TableCell>
                    <TableCell className="text-right tabular">
                      {formatQuantity(meal.quantity)}
                    </TableCell>
                    <TableCell>
                      {canDelete(meal) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete meal on ${formatDate(meal.date)}`}
                          onClick={() => setPendingDelete(meal)}
                        >
                          <Trash2 className="text-destructive" aria-hidden />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this meal?"
        description="This changes the meal rate and everyone's food cost for the cycle. It can't be undone."
        confirmLabel="Delete meal"
        destructive
        onConfirm={async () => {
          if (pendingDelete) await handleDelete(pendingDelete);
        }}
      />
    </Card>
  );
}
