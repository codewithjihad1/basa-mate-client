"use client";

import Link from "next/link";
import {
  Banknote,
  CalendarPlus,
  Plus,
  Receipt,
  Scale,
  ShoppingBasket,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { CardGridSkeleton } from "@/components/common/LoadingSkeleton";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { RoleGate } from "@/components/common/RoleGate";
import { StatCard } from "./StatCard";
import { CycleBanner } from "./CycleBanner";
import { GrocerySpendChart } from "@/components/charts/GrocerySpendChart";
import { ExpenseByCategoryChart } from "@/components/charts/ExpenseByCategoryChart";
import { MealsByMemberChart } from "@/components/charts/MealsByMemberChart";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { useGetCycleDashboardQuery } from "@/store/api/endpoints/cycleApi";
import { useGetMealSummaryQuery } from "@/store/api/endpoints/mealApi";
import { useListExpensesQuery } from "@/store/api/endpoints/expenseApi";
import { formatQuantity, parseMoney, roundMoney } from "@/lib/utils/money";
import type { BasaId, CycleId } from "@/types/api";

const QUICK_ACTIONS = [
  { href: "/meals", label: "Log today's meals", icon: UtensilsCrossed },
  { href: "/bazaar/new", label: "Add bazaar expense", icon: ShoppingBasket },
  { href: "/expenses/new", label: "Add shared expense", icon: Receipt },
  { href: "/deposits", label: "Add deposit", icon: Wallet },
  { href: "/settlement", label: "View settlement", icon: Scale },
];

export function DashboardView() {
  const { basaId, basa, members } = useActiveBasa();
  const { cycleId, hasNoCycle, isLoading: cycleLoading, error: cycleError } = useActiveCycle();

  const scope = { basaId: basaId as BasaId, cycleId: cycleId as CycleId };
  const skip = !basaId || !cycleId;

  const dashboardQuery = useGetCycleDashboardQuery(scope, { skip });
  const mealSummaryQuery = useGetMealSummaryQuery(scope, { skip });
  // The list is fetched unpaginated so the charts can aggregate the whole cycle.
  // Only `APPROVED` expenses feed the dashboard totals, so the charts match it.
  const expensesQuery = useListExpensesQuery(
    { ...scope, limit: 500, status: "APPROVED" },
    { skip },
  );

  if (cycleError) return <ErrorState error={cycleError} title="Couldn't load billing cycles" />;

  if (hasNoCycle) {
    return (
      <>
        <PageHeader title={basa?.name ?? "Dashboard"} />
        <EmptyState
          icon={CalendarPlus}
          title="No billing cycle yet"
          description="A billing cycle is the month everything is recorded against. Create one to start logging meals and expenses."
          action={
            <RoleGate permission="basa_settings">
              <Button asChild>
                <Link href="/settings/basa">
                  <Plus aria-hidden />
                  Create a cycle
                </Link>
              </Button>
            </RoleGate>
          }
        />
      </>
    );
  }

  const dashboard = dashboardQuery.data;
  const isLoading = cycleLoading || dashboardQuery.isLoading;
  const totalMeals = parseMoney(dashboard?.totalMeals);
  const mealRate = totalMeals > 0
    ? roundMoney(parseMoney(dashboard?.totalGroceryCost) / totalMeals)
    : 0;

  return (
    <>
      <PageHeader
        title={basa?.name ?? "Dashboard"}
        description="How this billing cycle is tracking."
      />

      <CycleBanner />

      {dashboardQuery.error ? (
        <ErrorState
          error={dashboardQuery.error}
          title="Couldn't load the cycle summary"
          onRetry={dashboardQuery.refetch}
        />
      ) : isLoading ? (
        <CardGridSkeleton count={6} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Members"
            value={dashboard?.members ?? members.length}
            icon={Users}
            hint="Active in this basa"
          />
          <StatCard
            label="Total meals"
            value={formatQuantity(dashboard?.totalMeals)}
            icon={UtensilsCrossed}
            hint="Across every roommate"
          />
          <StatCard
            label="Grocery cost"
            value={<MoneyDisplay value={dashboard?.totalGroceryCost} />}
            icon={ShoppingBasket}
            hint="Pooled bazaar spend"
          />
          <StatCard
            label="Meal rate"
            value={<MoneyDisplay value={mealRate} />}
            icon={Scale}
            hint={
              totalMeals > 0
                ? "Grocery cost ÷ total meals"
                : "Add meals to calculate the rate"
            }
          />
          <StatCard
            label="Shared expenses"
            value={<MoneyDisplay value={dashboard?.sharedExpenses} />}
            icon={Receipt}
            hint="Split between members"
          />
          <StatCard
            label="Total deposits"
            value={<MoneyDisplay value={dashboard?.totalDeposits} />}
            icon={Banknote}
            hint="Paid into the fund"
          />
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <Button key={href} variant="outline" size="sm" asChild>
              <Link href={href}>
                <Icon aria-hidden />
                {label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <GrocerySpendChart
          expenses={expensesQuery.data?.items}
          isLoading={expensesQuery.isLoading}
        />
        <ExpenseByCategoryChart
          expenses={expensesQuery.data?.items}
          isLoading={expensesQuery.isLoading}
        />
        <MealsByMemberChart
          summary={mealSummaryQuery.data}
          isLoading={mealSummaryQuery.isLoading}
        />
      </div>
    </>
  );
}
