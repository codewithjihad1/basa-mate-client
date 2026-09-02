"use client";

import { CalendarRange, Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CycleStatusBadge } from "@/components/common/StatusBadge";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { formatCycleTitle, formatDateRange } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

/** Picks the billing cycle every cycle-scoped screen reads from (§9). */
export function BillingCycleSelector() {
  const { cycle, cycles, selectCycle, isLoading, hasNoCycle } = useActiveCycle();

  if (isLoading) return <Skeleton className="h-10 w-48" />;
  if (hasNoCycle) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium",
          "hover:bg-accent hover:text-accent-foreground",
        )}
        aria-label="Switch billing cycle"
      >
        <CalendarRange className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{formatCycleTitle(cycle?.startDate ?? null)}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-60" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Billing cycles</DropdownMenuLabel>
        {cycles.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onSelect={() => selectCycle(item.id)}
            className={cn("justify-between gap-3", item.status === "CLOSED" && "opacity-80")}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Check
                className={cn("size-4", item.id === cycle?.id ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block truncate">{formatCycleTitle(item.startDate)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {formatDateRange(item.startDate, item.endDate)}
                </span>
              </span>
            </span>
            <CycleStatusBadge status={item.status} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
