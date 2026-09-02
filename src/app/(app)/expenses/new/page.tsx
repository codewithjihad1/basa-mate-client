import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { ExpenseForm } from "@/features/expenses/components/ExpenseForm";

export const metadata: Metadata = { title: "Add shared expense" };

export default function NewSharedExpensePage() {
  return (
    <>
      <PageHeader
        title="Add shared expense"
        description="Split a bill equally, by custom amount, or by percentage."
      />
      <Card>
        <CardContent className="pt-5">
          <ExpenseForm type="SHARED" redirectTo="/expenses" />
        </CardContent>
      </Card>
    </>
  );
}
