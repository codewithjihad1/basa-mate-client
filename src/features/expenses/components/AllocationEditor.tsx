"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { formatMoney, roundMoney } from "@/lib/utils/money";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import type { ExpenseFormInputValues } from "@/lib/validation/transactions";

/**
 * The per-member split for a SHARED expense (frontend-requirements §12).
 *
 * It shows the running total against the expense amount as the user types, so a
 * mismatch is visible before submitting — the same rule the server enforces with
 * `400 INVALID_ALLOCATION`. The server stays authoritative; this is only a preview.
 */
export function AllocationEditor() {
  const { control, register, setValue } = useFormContext<ExpenseFormInputValues>();
  const { members, currency } = useActiveBasa();

  const method = useWatch({ control, name: "allocationMethod" });
  const amount = Number(useWatch({ control, name: "amount" })) || 0;
  const watchedAllocations = useWatch({ control, name: "allocations" });
  const allocations = useMemo(() => watchedAllocations ?? [], [watchedAllocations]);

  const includedCount = allocations.filter((allocation) => allocation?.included).length;

  const totals = useMemo(() => {
    const included = allocations.filter((allocation) => allocation?.included);
    const amountTotal = roundMoney(
      included.reduce((sum, allocation) => sum + (Number(allocation?.amount) || 0), 0),
    );
    const percentageTotal = included.reduce(
      (sum, allocation) => sum + (Number(allocation?.percentage) || 0),
      0,
    );
    return { amountTotal, percentageTotal };
  }, [allocations]);

  if (method === undefined) return null;

  // EQUAL ignores per-entry values server-side; show the computed share instead.
  const equalShare = includedCount > 0 ? roundMoney(amount / includedCount) : 0;

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Split between</p>
        <p className="text-xs text-muted-foreground">
          {includedCount} of {members.length} selected
        </p>
      </div>

      <ul className="space-y-2">
        {members.map((member, index) => {
          const included = allocations[index]?.included ?? false;
          const checkboxId = `allocation-${member.id}`;

          return (
            <li key={member.id} className="flex items-center gap-3">
              <Checkbox
                id={checkboxId}
                checked={included}
                onCheckedChange={(checked) => {
                  setValue(`allocations.${index}.included`, checked === true, {
                    shouldValidate: true,
                  });
                  setValue(`allocations.${index}.memberId`, member.id);
                }}
              />
              <Label htmlFor={checkboxId} className="flex-1 truncate font-normal">
                {member.user?.name ?? "Unknown"}
              </Label>

              {method === "EQUAL" ? (
                <span className="tabular w-28 text-right text-sm text-muted-foreground">
                  {included ? formatMoney(equalShare, { currency }) : "—"}
                </span>
              ) : (
                <div className="w-28">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    disabled={!included}
                    className="text-right tabular"
                    aria-label={
                      method === "PERCENTAGE"
                        ? `Percentage for ${member.user?.name}`
                        : `Amount for ${member.user?.name}`
                    }
                    {...register(
                      method === "PERCENTAGE"
                        ? `allocations.${index}.percentage`
                        : `allocations.${index}.amount`,
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {method !== "EQUAL" ? (
        <p
          className={cn(
            "border-t border-border pt-3 text-sm",
            method === "CUSTOM_AMOUNT"
              ? totals.amountTotal === roundMoney(amount)
                ? "text-[var(--success)]"
                : "text-destructive"
              : Math.abs(totals.percentageTotal - 100) <= 0.0001
                ? "text-[var(--success)]"
                : "text-destructive",
          )}
          aria-live="polite"
        >
          {method === "CUSTOM_AMOUNT"
            ? `Allocated ${formatMoney(totals.amountTotal, { currency })} of ${formatMoney(amount, { currency })}`
            : `Allocated ${totals.percentageTotal}% of 100%`}
        </p>
      ) : null}
    </div>
  );
}
