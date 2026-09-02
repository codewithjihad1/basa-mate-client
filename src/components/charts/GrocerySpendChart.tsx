"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "./ChartContainer";
import { parseMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import type { Expense } from "@/types/api";

/** Cumulative grocery spend across the cycle (frontend-requirements §8). */
export function GrocerySpendChart({
  expenses,
  isLoading,
}: {
  expenses: Expense[] | undefined;
  isLoading: boolean;
}) {
  const data = useMemo(() => {
    const byDate = new Map<string, number>();
    (expenses ?? [])
      .filter((expense) => expense.type === "GROCERY")
      .forEach((expense) => {
        const day = expense.date.slice(0, 10);
        byDate.set(day, (byDate.get(day) ?? 0) + parseMoney(expense.amount));
      });

    // Accumulated with `reduce` rather than a mutable counter across `map`, which
    // reassigns a variable after render and is unsafe under the React Compiler.
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce<Array<{ day: string; spend: number; total: number }>>((rows, [day, amount]) => {
        const total = (rows.at(-1)?.total ?? 0) + amount;
        rows.push({ day: formatDate(day, "dd MMM"), spend: amount, total });
        return rows;
      }, []);
  }, [expenses]);

  return (
    <ChartContainer
      title="Grocery spending over time"
      description="Cumulative bazaar spend this cycle"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyMessage="No bazaar expenses recorded yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="grocerySpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={64} />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Running total"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#grocerySpend)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
