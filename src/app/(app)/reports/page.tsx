import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { ReportView } from "@/features/reports/components/ReportView";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Monthly report" description="The full picture for this billing cycle." />
      <ReportView />
    </>
  );
}
