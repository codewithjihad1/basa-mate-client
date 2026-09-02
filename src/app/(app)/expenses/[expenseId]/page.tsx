import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { EditExpenseView } from "@/features/expenses/components/EditExpenseView";

export const metadata: Metadata = { title: "Edit shared expense" };

export default async function EditSharedExpensePage(props: PageProps<"/expenses/[expenseId]">) {
  const { expenseId } = await props.params;

  return (
    <>
      <PageHeader
        title="Edit shared expense"
        description="Saving replaces the whole allocation set on the server."
      />
      <EditExpenseView expenseId={expenseId} type="SHARED" redirectTo="/expenses" />
    </>
  );
}
