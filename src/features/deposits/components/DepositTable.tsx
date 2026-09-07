"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Trash2, Wallet, X } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { ApprovalStatusBadge } from "@/components/common/StatusBadge";
import { DepositForm } from "./DepositForm";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useDeleteDepositMutation,
  useListDepositsQuery,
  useReviewDepositMutation,
} from "@/store/api/endpoints/depositApi";
import { PAYMENT_METHOD_LABELS } from "@/config/constants";
import { formatDate } from "@/lib/utils/date";
import { sumMoney } from "@/lib/utils/money";
import { getErrorMessage } from "@/lib/api/errors";
import type { ApprovalStatus, BasaId, CycleId, Deposit } from "@/types/api";

const ALL = "__all__";

/** Deposit history for the cycle (frontend-requirements §13). */
export function DepositTable() {
  const { basaId } = useActiveBasa();
  const { cycleId, isClosed } = useActiveCycle();
  const { user } = useAuth();
  const { canManageDeposits, canReviewDeposits } = usePermissions();

  const [status, setStatus] = useState(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Deposit | null>(null);
  const [deleteDeposit] = useDeleteDepositMutation();
  const [reviewDeposit, { isLoading: isReviewing }] = useReviewDepositMutation();

  const { data, isLoading, error, refetch } = useListDepositsQuery(
    {
      basaId: basaId as BasaId,
      cycleId: cycleId as CycleId,
      status: status === ALL ? undefined : (status as ApprovalStatus),
    },
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

  const handleReview = async (deposit: Deposit, action: "approve" | "reject") => {
    try {
      await reviewDeposit({
        basaId: basaId as BasaId,
        cycleId: cycleId as CycleId,
        depositId: deposit.id,
        action,
      }).unwrap();
      toast.success(action === "approve" ? "Deposit approved" : "Deposit rejected");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  /** Owners/managers may delete any record; members only their own, while pending. */
  const canDelete = (deposit: Deposit) =>
    canReviewDeposits || (deposit.approvalStatus === "PENDING" && deposit.recordedBy === user?.id);

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
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="deposit-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value)}
            >
              <SelectTrigger id="deposit-status" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value="PENDING">Pending review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton columns={7} />
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
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col" className="text-right">
                    Amount
                  </TableHead>
                  <TableHead scope="col" className="w-64">
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
                    <TableCell>
                      <ApprovalStatusBadge status={deposit.approvalStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay value={deposit.amount} />
                    </TableCell>
                    <TableCell>
                      {canReviewDeposits || canDelete(deposit) ? (
                        <div className="flex justify-end gap-1">
                          {deposit.approvalStatus === "PENDING" && canReviewDeposits ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isClosed || isReviewing}
                                aria-label={`Approve ${deposit.member?.user?.name ?? "deposit"}'s deposit`}
                                onClick={() => handleReview(deposit, "approve")}
                              >
                                <Check className="text-[var(--success)]" aria-hidden />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isClosed || isReviewing}
                                aria-label={`Reject ${deposit.member?.user?.name ?? "deposit"}'s deposit`}
                                onClick={() => handleReview(deposit, "reject")}
                              >
                                <X className="text-destructive" aria-hidden />
                              </Button>
                            </>
                          ) : null}
                          {canDelete(deposit) ? (
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
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5}>Total deposited</TableCell>
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
