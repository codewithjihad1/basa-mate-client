import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { MealCalendar } from "@/features/meals/components/MealCalendar";

export const metadata: Metadata = { title: "Meal calendar" };

export default function MealCalendarPage() {
  return (
    <>
      <PageHeader title="Meal calendar" description="Meals per day across the month." />
      <MealCalendar />
    </>
  );
}
