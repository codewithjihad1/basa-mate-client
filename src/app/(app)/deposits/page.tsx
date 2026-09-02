import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { DepositTable } from "@/features/deposits/components/DepositTable";

export const metadata: Metadata = { title: "Deposits" };

export default function DepositsPage() {
  return (
    <>
      <PageHeader
        title="Deposits"
        description="What each roommate has paid into the fund this cycle."
      />
      <DepositTable />
    </>
  );
}
