import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { RoleGate } from "@/components/common/RoleGate";
import { ExpenseTable } from "@/features/expenses/components/ExpenseTable";

export const metadata: Metadata = { title: "Shared expenses" };

export default function SharedExpensesPage() {
  return (
    <>
      <PageHeader
        title="Shared expenses"
        description="Bills split explicitly between roommates, rather than by meals."
        actions={
          <RoleGate permission="add_expense">
            <Button asChild>
              <Link href="/expenses/new">
                <Plus aria-hidden />
                Add shared expense
              </Link>
            </Button>
          </RoleGate>
        }
      />
      <ExpenseTable type="SHARED" basePath="/expenses" emptyTitle="No shared expenses found." />
    </>
  );
}
