import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { RoleGate } from "@/components/common/RoleGate";
import { ExpenseTable } from "@/features/expenses/components/ExpenseTable";

export const metadata: Metadata = { title: "Bazaar" };

export default function BazaarPage() {
  return (
    <>
      <PageHeader
        title="Bazaar"
        description="Grocery spending, pooled across the basa and divided by meals eaten."
        actions={
          <RoleGate permission="add_expense">
            <Button asChild>
              <Link href="/bazaar/new">
                <Plus aria-hidden />
                Add bazaar expense
              </Link>
            </Button>
          </RoleGate>
        }
      />
      <ExpenseTable type="GROCERY" basePath="/bazaar" emptyTitle="No bazaar expenses found." />
    </>
  );
}
