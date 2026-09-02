"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { SettlementStatusBadge } from "@/components/common/StatusBadge";
import { formatQuantity } from "@/lib/utils/money";
import type { Settlement } from "@/types/api";

/**
 * The cycle-level settlement figures (frontend-requirements §14).
 *
 * Every number is rendered straight from the settlement the server computed — the
 * frontend displays the calculation inputs rather than deciding any of them.
 */
export function SettlementSummary({ settlement }: { settlement: Settlement }) {
  const rows = [
    { label: "Total grocery cost", value: <MoneyDisplay value={settlement.totalGroceryCost} /> },
    { label: "Total meals", value: <span className="tabular">{formatQuantity(settlement.totalMeals)}</span> },
    { label: "Meal rate", value: <MoneyDisplay value={settlement.mealRate} /> },
    { label: "Shared expenses", value: <MoneyDisplay value={settlement.totalSharedExpenses} /> },
    {
      label: "Total deposits",
      value: (
        <MoneyDisplay
          value={(settlement.items ?? []).reduce(
            (sum, item) => sum + Number(item.initialDeposit || 0),
            0,
          )}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">Cycle totals</h2>
          <SettlementStatusBadge status={settlement.status} />
        </div>

        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        {/* The rate is derived, not entered — spelling it out prevents "why that number?". */}
        <p className="mt-4 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Meal rate = total grocery cost ÷ total meals. Each roommate is charged their meals × the
          rate, plus their share of shared expenses, less what they deposited.
        </p>
      </CardContent>
    </Card>
  );
}
