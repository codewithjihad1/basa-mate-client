import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { MealForm } from "@/features/meals/components/MealForm";
import { MealSummaryTable } from "@/features/meals/components/MealSummaryTable";

export const metadata: Metadata = { title: "Meals" };

export default function MealsPage() {
  return (
    <>
      <PageHeader
        title="Meals"
        description="Log what was eaten today and see the cycle's totals."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/meals/calendar">
                <CalendarDays aria-hidden />
                Calendar
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/meals/history">
                <History aria-hidden />
                History
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <MealForm />
        <MealSummaryTable />
      </div>
    </>
  );
}
