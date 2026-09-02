"use client";

import { useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { useListMealsQuery } from "@/store/api/endpoints/mealApi";
import { parseApiDate } from "@/lib/utils/date";
import { parseMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { BasaId, CycleId } from "@/types/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Monthly meal calendar with a per-day count (frontend-requirements §10.2). */
export function MealCalendar({ onSelectDate }: { onSelectDate?: (date: Date) => void }) {
  const { basaId } = useActiveBasa();
  const { cycleId, cycle } = useActiveCycle();

  // Start on the cycle's month so the calendar matches the selected billing period.
  const [month, setMonth] = useState(() => startOfMonth(parseApiDate(cycle?.startDate) ?? new Date()));
  const [selected, setSelected] = useState<Date | null>(null);

  const { data, isLoading, error } = useListMealsQuery(
    { basaId: basaId as BasaId, cycleId: cycleId as CycleId },
    { skip: !basaId || !cycleId },
  );

  const countsByDay = useMemo(() => {
    const counts = new Map<string, number>();
    (data ?? []).forEach((meal) => {
      const key = meal.date.slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + parseMoney(meal.quantity));
    });
    return counts;
  }, [data]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }),
    [month],
  );

  // Blank cells so the 1st lands under the right weekday.
  const leadingBlanks = getDay(startOfMonth(month));

  if (error) return <ErrorState error={error} title="Couldn't load the meal calendar" />;

  const handleSelect = (day: Date) => {
    setSelected(day);
    onSelectDate?.(day);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{format(month, "MMMM yyyy")}</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div role="grid" aria-label="Meal calendar">
            <div role="row" className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  role="columnheader"
                  className="py-1 text-center text-xs font-medium text-muted-foreground"
                >
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }).map((_, index) => (
                <div key={`blank-${index}`} aria-hidden />
              ))}

              {days.map((day) => {
                const count = countsByDay.get(format(day, "yyyy-MM-dd")) ?? 0;
                const isSelected = selected ? isSameDay(day, selected) : false;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    role="gridcell"
                    onClick={() => handleSelect(day)}
                    aria-label={`${format(day, "d MMMM yyyy")}, ${count} meals`}
                    aria-selected={isSelected}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                      "hover:border-primary hover:bg-accent",
                      isSelected ? "border-primary bg-primary/10" : "border-transparent",
                      isToday(day) && !isSelected && "border-border font-semibold",
                    )}
                  >
                    <span className="tabular">{format(day, "d")}</span>
                    {count > 0 ? (
                      <span className="tabular text-[11px] font-medium text-primary">{count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
