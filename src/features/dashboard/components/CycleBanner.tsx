"use client";

import { CalendarRange } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CycleStatusBadge } from "@/components/common/StatusBadge";
import { BillingCycleSelector } from "@/components/layout/BillingCycleSelector";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { formatCycleTitle, formatDateRange } from "@/lib/utils/date";

/** The active billing cycle header (frontend-requirements §9). */
export function CycleBanner() {
  const { cycle } = useActiveCycle();

  if (!cycle) return null;

  return (
    <Card className={cycle.status === "CLOSED" ? "border-dashed bg-muted/30" : undefined}>
      <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarRange className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium">{formatCycleTitle(cycle.startDate)}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(cycle.startDate, cycle.endDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CycleStatusBadge status={cycle.status} />
          <div className="sm:hidden">
            <BillingCycleSelector />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
