"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "./ChartContainer";
import type { MealSummary } from "@/types/api";

/** Meals eaten per roommate for the cycle (frontend-requirements §8). */
export function MealsByMemberChart({
  summary,
  isLoading,
}: {
  summary: MealSummary | undefined;
  isLoading: boolean;
}) {
  const data = (summary?.items ?? []).map((item) => ({
    name: item.name.split(" ")[0],
    meals: item.totalMeals,
  }));

  return (
    <ChartContainer
      title="Meals by roommate"
      description="Total meals eaten this cycle"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyMessage="No meals recorded yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="meals" fill="var(--chart-1)" radius={[6, 6, 0, 0]} name="Meals" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
