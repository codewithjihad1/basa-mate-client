"use client";

import { useState } from "react";
import { Download, FileBarChart, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { CardGridSkeleton, TableSkeleton } from "@/components/common/LoadingSkeleton";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { SettlementSummary } from "@/features/settlement/components/SettlementSummary";
import { SettlementTable } from "@/features/settlement/components/SettlementTable";
import { CycleBanner } from "@/features/dashboard/components/CycleBanner";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { useAppSelector } from "@/store/hooks";
import { downloadCsvReport, useGetReportQuery } from "@/store/api/endpoints/settlementApi";
import { formatCycleTitle, formatDate } from "@/lib/utils/date";
import { formatQuantity } from "@/lib/utils/money";
import { getErrorMessage } from "@/lib/api/errors";
import type { BasaId, CycleId } from "@/types/api";

/**
 * The monthly report (frontend-requirements §16).
 *
 * The API exposes JSON and CSV. There is no PDF or Excel endpoint, so those two
 * export options from the requirements are not offered rather than being faked —
 * the browser's print dialog covers PDF for now.
 */
export function ReportView() {
  const { basaId, basa } = useActiveBasa();
  const { cycleId, cycle } = useActiveCycle();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error, refetch } = useGetReportQuery(
    { basaId: basaId as BasaId, cycleId: cycleId as CycleId },
    { skip: !basaId || !cycleId },
  );

  const handleCsvDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadCsvReport(basaId as BasaId, cycleId as CycleId, accessToken);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${basa?.name ?? "basa"}-${formatCycleTitle(cycle?.startDate ?? null)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsDownloading(false);
    }
  };

  if (error) return <ErrorState error={error} title="Couldn't load the report" onRetry={refetch} />;

  if (isLoading) {
    return (
      <>
        <CardGridSkeleton count={3} />
        <TableSkeleton />
      </>
    );
  }

  if (!data) {
    return <EmptyState icon={FileBarChart} title="No report available for this cycle." />;
  }

  const totalMeals = data.meals.reduce((sum, row) => sum + Number(row._sum.quantity || 0), 0);

  return (
    <>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" onClick={handleCsvDownload} loading={isDownloading}>
          <FileSpreadsheet aria-hidden />
          Export expenses (CSV)
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Download aria-hidden />
          Print / save as PDF
        </Button>
      </div>

      <CycleBanner />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basa</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-3">
            <Field label="Name" value={basa?.name ?? "—"} />
            <Field label="Location" value={basa?.location ?? "—"} />
            <Field label="Members" value={String(basa?.members?.length ?? 0)} />
            <Field
              label="Billing period"
              value={`${formatDate(data.cycle.startDate)} — ${formatDate(data.cycle.endDate)}`}
            />
            <Field label="Total meals" value={formatQuantity(totalMeals)} />
            <Field label="Expenses recorded" value={String(data.expenses.length)} />
          </dl>
        </CardContent>
      </Card>

      {data.settlement ? (
        <>
          <SettlementSummary settlement={data.settlement} />
          <SettlementTable settlement={data.settlement} />
        </>
      ) : (
        <EmptyState
          icon={FileBarChart}
          title="No settlement for this cycle yet"
          description="Close the cycle and generate the settlement to include final balances in the report."
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {data.expenses.length === 0 ? (
            <EmptyState title="No expenses in this cycle." className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Date</TableHead>
                  <TableHead scope="col">Description</TableHead>
                  <TableHead scope="col">Category</TableHead>
                  <TableHead scope="col" className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.description || "—"}</TableCell>
                    <TableCell>{expense.category?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay value={expense.amount} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
