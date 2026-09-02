import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { EditExpenseView } from "@/features/expenses/components/EditExpenseView";

export const metadata: Metadata = { title: "Edit bazaar expense" };

/** `params` is a Promise in Next 16 — it must be awaited before use. */
export default async function EditBazaarExpensePage(props: PageProps<"/bazaar/[expenseId]">) {
  const { expenseId } = await props.params;

  return (
    <>
      <PageHeader title="Edit bazaar expense" />
      <EditExpenseView expenseId={expenseId} type="GROCERY" redirectTo="/bazaar" />
    </>
  );
}
