import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { MealHistoryTable } from "@/features/meals/components/MealHistoryTable";

export const metadata: Metadata = { title: "Meal history" };

export default function MealHistoryPage() {
  return (
    <>
      <PageHeader title="Meal history" description="Every meal recorded in this cycle." />
      <MealHistoryTable />
    </>
  );
}
