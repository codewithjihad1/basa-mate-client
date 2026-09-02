"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { SettlementItemBadge } from "@/components/common/StatusBadge";
import { formatQuantity } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { Settlement } from "@/types/api";

/**
 * Per-roommate settlement (frontend-requirements §14).
 *
 * On narrow screens the table becomes a card list, because a seven-column financial
 * table is unreadable on a phone (§31) — and this is one of the screens the
 * requirements call out for mobile.
 */
export function SettlementTable({ settlement }: { settlement: Settlement }) {
  const items = settlement.items ?? [];

  return (
    <>
      {/* Desktop and tablet */}
      <Card className="hidden md:block">
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Roommate</TableHead>
                <TableHead scope="col" className="text-right">Meals</TableHead>
                <TableHead scope="col" className="text-right">Deposit</TableHead>
                <TableHead scope="col" className="text-right">Food cost</TableHead>
                <TableHead scope="col" className="text-right">Shared cost</TableHead>
                <TableHead scope="col" className="text-right">Balance</TableHead>
                <TableHead scope="col">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.member?.user?.name ?? "Unknown"}
                  </TableCell>
                  <TableCell className="text-right tabular">
                    {formatQuantity(item.totalMeals)}
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyDisplay value={item.initialDeposit} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyDisplay value={item.foodCost} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyDisplay value={item.individualShare} />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <MoneyDisplay value={item.finalBalance} signed />
                  </TableCell>
                  <TableCell>
                    <SettlementItemBadge status={item.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile */}
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <Card>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.member?.user?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatQuantity(item.totalMeals)} meals
                    </p>
                  </div>
                  <SettlementItemBadge status={item.status} />
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <SummaryPair label="Deposit" value={item.initialDeposit} />
                  <SummaryPair label="Food cost" value={item.foodCost} />
                  <SummaryPair label="Shared cost" value={item.individualShare} />
                  <SummaryPair label="Total cost" value={item.totalCost} />
                </dl>

                <div
                  className={cn(
                    "flex items-center justify-between border-t border-border pt-3 font-semibold",
                  )}
                >
                  <span className="text-sm">Balance</span>
                  <MoneyDisplay value={item.finalBalance} signed />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}

function SummaryPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>
        <MoneyDisplay value={value} />
      </dd>
    </div>
  );
}
