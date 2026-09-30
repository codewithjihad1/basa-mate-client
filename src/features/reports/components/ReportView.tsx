"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import {
    CardGridSkeleton,
    TableSkeleton,
} from "@/components/common/LoadingSkeleton";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
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
import { CycleBanner } from "@/features/dashboard/components/CycleBanner";
import { SettlementSummary } from "@/features/settlement/components/SettlementSummary";
import { SettlementTable } from "@/features/settlement/components/SettlementTable";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { getErrorMessage } from "@/lib/api/errors";
import { formatCycleTitle, formatDate } from "@/lib/utils/date";
import { formatQuantity } from "@/lib/utils/money";
import { useListMealsQuery } from "@/store/api/endpoints/mealApi";
import {
    downloadCsvReport,
    useGetReportQuery,
} from "@/store/api/endpoints/settlementApi";
import { useAppSelector } from "@/store/hooks";
import type { BasaId, CycleId } from "@/types/api";
import { Download, FileBarChart, FileSpreadsheet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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

    const { data: mealEntries = [] } = useListMealsQuery(
        {
            basaId: basaId as BasaId,
            cycleId: cycleId as CycleId,
        },
        { skip: !basaId || !cycleId },
    );

    const handleCsvDownload = async () => {
        setIsDownloading(true);
        try {
            const blob = await downloadCsvReport(
                basaId as BasaId,
                cycleId as CycleId,
                accessToken,
            );
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

    const totalMeals =
        data?.meals.reduce(
            (sum, row) => sum + Number(row._sum.quantity || 0),
            0,
        ) ?? 0;
    const reportMembers = (basa?.members ?? []).map((member) => ({
        id: member.id,
        name: member.user?.name ?? "Unknown member",
        total: Number(
            data?.meals.find((row) => row.memberId === member.id)?._sum
                .quantity ?? 0,
        ),
    }));

    const dayMealRows = useMemo(() => {
        if (!data || !data.cycle.startDate || !data.cycle.endDate) return [];

        const aggregated = mealEntries.reduce<
            Record<string, Record<string, number>>
        >((acc, meal) => {
            const dateKey = meal.date.slice(0, 10);
            if (!acc[dateKey]) acc[dateKey] = {};
            acc[dateKey][meal.memberId] =
                (acc[dateKey][meal.memberId] ?? 0) + Number(meal.quantity ?? 0);
            return acc;
        }, {});

        const start = new Date(data.cycle.startDate);
        const end = new Date(data.cycle.endDate);
        const rows: Array<{
            day: number;
            dateKey: string;
            counts: Record<string, number>;
        }> = [];

        for (
            let current = new Date(start);
            current <= end;
            current.setDate(current.getDate() + 1)
        ) {
            const dateKey = current.toISOString().slice(0, 10);
            rows.push({
                day: current.getDate(),
                dateKey,
                counts: aggregated[dateKey] ?? {},
            });
        }

        return rows;
    }, [data, mealEntries]);

    if (error)
        return (
            <ErrorState
                error={error}
                title="Couldn't load the report"
                onRetry={refetch}
            />
        );

    if (isLoading) {
        return (
            <>
                <CardGridSkeleton count={3} />
                <TableSkeleton />
            </>
        );
    }

    if (!data) {
        return (
            <EmptyState
                icon={FileBarChart}
                title="No report available for this cycle."
            />
        );
    }

    return (
        <>
            <div className="flex flex-wrap gap-2 print:hidden">
                <Button
                    variant="outline"
                    onClick={handleCsvDownload}
                    loading={isDownloading}
                >
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
                        <Field
                            label="Members"
                            value={String(basa?.members?.length ?? 0)}
                        />
                        <Field
                            label="Billing period"
                            value={`${formatDate(data.cycle.startDate)} — ${formatDate(data.cycle.endDate)}`}
                        />
                        <Field
                            label="Total meals"
                            value={formatQuantity(totalMeals)}
                        />
                        <Field
                            label="Expenses recorded"
                            value={String(data.expenses.length)}
                        />
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

            {/* Daily meal counts */}
            <Card className="overflow-hidden border-border bg-card shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base text-foreground">
                            Daily meal counts
                        </CardTitle>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            {reportMembers.length} members
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="min-w-175 border-separate border-spacing-0">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16 border border-border bg-slate-100 px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                                        Day
                                    </TableHead>
                                    {reportMembers.map((member, index) => (
                                        <TableHead
                                            key={member.id}
                                            className="w-40 border border-border bg-slate-100 px-2 py-3 text-center text-sm font-semibold text-emerald-700"
                                        >
                                            {member.name || `Name ${index + 1}`}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dayMealRows.map((row) => (
                                    <TableRow key={row.dateKey}>
                                        <TableCell className="border border-border bg-white px-2 py-3 text-center text-sm font-medium text-slate-700">
                                            {row.day}
                                        </TableCell>
                                        {reportMembers.map((member) => (
                                            <TableCell
                                                key={`${row.dateKey}-${member.id}`}
                                                className="border border-border bg-slate-50/40 px-2 py-3 text-center text-sm text-slate-700"
                                            >
                                                {row.counts[member.id] ?? ""}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.expenses.length === 0 ? (
                        <EmptyState
                            title="No expenses in this cycle."
                            className="border-0"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead scope="col">Date</TableHead>
                                    <TableHead scope="col">
                                        Description
                                    </TableHead>
                                    <TableHead scope="col">Category</TableHead>
                                    <TableHead
                                        scope="col"
                                        className="text-right"
                                    >
                                        Amount
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.expenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(expense.date)}
                                        </TableCell>
                                        <TableCell>
                                            {expense.description || "—"}
                                        </TableCell>
                                        <TableCell>
                                            {expense.category?.name ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <MoneyDisplay
                                                value={expense.amount}
                                            />
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
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </dt>
            <dd className="font-medium">{value}</dd>
        </div>
    );
}
