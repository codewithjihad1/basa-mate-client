"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CycleStatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/utils/date";
import { CreateCycleButton } from "./CreateCycleDialog";

/**
 * Creating and reviewing billing cycles (frontend-requirements §9).
 *
 * The server allows only one `ACTIVE` cycle per basa, so the create form is hidden
 * while one is open — the next cycle starts after the current one is closed.
 */
export function CycleManager() {
  const { basa } = useActiveBasa();
  const { cycles, isLoading } = useActiveCycle();
  const { canEditSettings } = usePermissions();
  const hasActiveCycle = cycles.some((cycle) => cycle.status === "ACTIVE");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Billing cycles</CardTitle>
        <CardDescription>
          Everything — meals, expenses, deposits, settlement — belongs to a cycle.
          {basa ? ` This basa's cycles start on day ${basa.cycleStartDay}.` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {canEditSettings && !hasActiveCycle ? (
          <CreateCycleButton />
        ) : null}

        {canEditSettings && hasActiveCycle ? (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            There&apos;s already an active cycle. Close it from the settlement screen before starting
            the next one.
          </p>
        ) : null}

        {isLoading ? (
          <TableSkeleton columns={5} rows={3} />
        ) : cycles.length === 0 ? (
          <EmptyState title="No billing cycles yet." className="border-0" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Period</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">Meals</TableHead>
                <TableHead scope="col" className="text-right">Expenses</TableHead>
                <TableHead scope="col" className="text-right">Deposits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
                  </TableCell>
                  <TableCell>
                    <CycleStatusBadge status={cycle.status} />
                  </TableCell>
                  <TableCell className="text-right tabular">{cycle._count?.meals ?? 0}</TableCell>
                  <TableCell className="text-right tabular">{cycle._count?.expenses ?? 0}</TableCell>
                  <TableCell className="text-right tabular">{cycle._count?.deposits ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
