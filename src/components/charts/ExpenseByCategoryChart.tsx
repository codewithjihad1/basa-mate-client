"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, ChartContainer } from "./ChartContainer";
import { parseMoney } from "@/lib/utils/money";
import type { Expense } from "@/types/api";

/** Spend grouped by expense category (frontend-requirements §8). */
export function ExpenseByCategoryChart({
  expenses,
  isLoading,
}: {
  expenses: Expense[] | undefined;
  isLoading: boolean;
}) {
  const data = useMemo(() => {
    const totals = new Map<string, number>();
    (expenses ?? []).forEach((expense) => {
      const key = expense.category?.name ?? "Uncategorised";
      totals.set(key, (totals.get(key) ?? 0) + parseMoney(expense.amount));
    });
    return Array.from(totals, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [expenses]);

  return (
    <ChartContainer
      title="Spending by category"
      description="Where the money went this cycle"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyMessage="No expenses recorded yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
