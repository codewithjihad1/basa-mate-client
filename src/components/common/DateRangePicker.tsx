"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  idPrefix?: string;
}

/**
 * A native date-input range. Native inputs give keyboard and screen-reader support
 * and the mobile date wheel for free, which matters more here than a custom calendar.
 */
export function DateRangePicker({ value, onChange, className, idPrefix = "range" }: DateRangePickerProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end", className)}>
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor={`${idPrefix}-from`}>From</Label>
        <Input
          id={`${idPrefix}-from`}
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor={`${idPrefix}-to`}>To</Label>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
        />
      </div>
    </div>
  );
}
