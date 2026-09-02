"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { DepositForm } from "./DepositForm";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useDeleteDepositMutation,
  useListDepositsQuery,
} from "@/store/api/endpoints/depositApi";
import { PAYMENT_METHOD_LABELS } from "@/config/constants";
import { formatDate } from "@/lib/utils/date";
import { sumMoney } from "@/lib/utils/money";
import { getErrorMessage } from "@/lib/api/errors";
import type { BasaId, CycleId, Deposit } from "@/types/api";

/** Deposit history for the cycle (frontend-requirements §13). */
export function DepositTable() {
  const { basaId } = useActiveBasa();
  const { cycleId, isClosed } = useActiveCycle();
  const { canManageDeposits } = usePermissions();

  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Deposit | null>(null);
  const [deleteDeposit] = useDeleteDepositMutation();

  const { data, isLoading, error, refetch } = useListDepositsQuery(
    { basaId: basaId as BasaId, cycleId: cycleId as CycleId },
    { skip: !basaId || !cycleId },
  );

  const deposits = useMemo(() => data ?? [], [data]);
  const total = useMemo(
    () => sumMoney(deposits.map((deposit) => deposit.amount)),
    [deposits],
  );

  const handleDelete = async (deposit: Deposit) => {
    try {
      await deleteDeposit({
        basaId: basaId as BasaId,
        cycleId: cycleId as CycleId,
        depositId: deposit.id,
      }).unwrap();
      toast.success("Deposit deleted");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  if (error) return <ErrorState error={error} title="Couldn't load deposits" onRetry={refetch} />;

  return (
    <>
      {canManageDeposits ? (
        <div className="flex justify-end">
          <Button onClick={() => setFormOpen(true)} disabled={isClosed}>
            <Plus aria-hidden />
            Add deposit
          </Button>
        </div>
      ) : null}

      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <TableSkeleton columns={6} />
          ) : deposits.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No deposits recorded yet."
              description="Deposits are what each roommate has paid into the fund this cycle."
              action={
                canManageDeposits && !isClosed ? (
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus aria-hidden />
                    Add deposit
                  </Button>
                ) : undefined
              }
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Roommate</TableHead>
                  <TableHead scope="col">Date</TableHead>
                  <TableHead scope="col">Method</TableHead>
                  <TableHead scope="col">Reference</TableHead>
                  <TableHead scope="col" className="text-right">
                    Amount
                  </TableHead>
                  <TableHead scope="col" className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {deposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-medium">
                      {deposit.member?.user?.name ?? "Unknown"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(deposit.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {PAYMENT_METHOD_LABELS[deposit.paymentMethod]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-muted-foreground">
                      {deposit.reference || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay value={deposit.amount} />
                    </TableCell>
                    <TableCell>
                      {canManageDeposits ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isClosed}
                          aria-label={`Delete deposit from ${deposit.member?.user?.name ?? "member"}`}
                          onClick={() => setPendingDelete(deposit)}
                        >
                          <Trash2 className="text-destructive" aria-hidden />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total deposited</TableCell>
                  <TableCell className="text-right">
                    <MoneyDisplay value={total} />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      <DepositForm open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this deposit?"
        description="It stops counting toward the settlement, changing this roommate's final balance."
        confirmLabel="Delete deposit"
        destructive
        onConfirm={async () => {
          if (pendingDelete) await handleDelete(pendingDelete);
        }}
      />
    </>
  );
}
