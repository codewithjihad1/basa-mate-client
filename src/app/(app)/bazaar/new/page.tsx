import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { ExpenseForm } from "@/features/expenses/components/ExpenseForm";

export const metadata: Metadata = { title: "Add bazaar expense" };

export default function NewBazaarExpensePage() {
  return (
    <>
      <PageHeader title="Add bazaar expense" description="Grocery spend for the whole basa." />
      <Card>
        <CardContent className="pt-5">
          <ExpenseForm type="GROCERY" redirectTo="/bazaar" />
        </CardContent>
      </Card>
    </>
  );
}
