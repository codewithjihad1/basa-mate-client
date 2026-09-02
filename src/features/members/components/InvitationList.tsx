"use client";

import { useState } from "react";
import { MailPlus, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { InvitationStatusBadge } from "@/components/common/StatusBadge";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useCancelInvitationMutation,
  useListInvitationsQuery,
  useResendInvitationMutation,
} from "@/store/api/endpoints/basaApi";
import { ROLE_LABELS } from "@/config/constants";
import { formatDate } from "@/lib/utils/date";
import { getErrorMessage } from "@/lib/api/errors";
import type { BasaId, Invitation } from "@/types/api";

/** Pending, accepted and expired invitations (frontend-requirements §18). */
export function InvitationList() {
  const { basaId } = useActiveBasa();
  const { canManageMembers } = usePermissions();

  const [pendingCancel, setPendingCancel] = useState<Invitation | null>(null);
  const [resendInvitation, { isLoading: isResending }] = useResendInvitationMutation();
  const [cancelInvitation] = useCancelInvitationMutation();

  const { data, isLoading, error, refetch } = useListInvitationsQuery(basaId as BasaId, {
    skip: !basaId,
  });

  const handleResend = async (invitation: Invitation) => {
    try {
      await resendInvitation({ basaId: basaId as BasaId, invitationId: invitation.id }).unwrap();
      // Resending regenerates the token, so any previously sent link stops working.
      toast.success("Invitation resent — the previous link no longer works");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  const handleCancel = async (invitation: Invitation) => {
    try {
      await cancelInvitation({ basaId: basaId as BasaId, invitationId: invitation.id }).unwrap();
      toast.success("Invitation cancelled");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  if (error) return <ErrorState error={error} title="Couldn't load invitations" onRetry={refetch} />;

  const invitations = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invitations</CardTitle>
        <CardDescription>Invitations sent for this basa.</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <TableSkeleton columns={5} />
        ) : invitations.length === 0 ? (
          <EmptyState
            icon={MailPlus}
            title="No invitations sent yet."
            description="Invite a roommate and their invitation will appear here."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Email</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Expires</TableHead>
                <TableHead scope="col" className="w-24">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="max-w-56 truncate font-medium">
                    {invitation.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABELS[invitation.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <InvitationStatusBadge status={invitation.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(invitation.expiresAt)}
                  </TableCell>
                  <TableCell>
                    {canManageMembers ? (
                      <div className="flex justify-end gap-1">
                        {invitation.status === "PENDING" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isResending}
                            aria-label={`Resend invitation to ${invitation.email}`}
                            onClick={() => handleResend(invitation)}
                          >
                            <RotateCw aria-hidden />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Cancel invitation to ${invitation.email}`}
                          onClick={() => setPendingCancel(invitation)}
                        >
                          <Trash2 className="text-destructive" aria-hidden />
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ConfirmDialog
        open={pendingCancel !== null}
        onOpenChange={(open) => !open && setPendingCancel(null)}
        title="Cancel this invitation?"
        description={`The link sent to ${pendingCancel?.email ?? "this address"} will stop working. You can always send a new one.`}
        confirmLabel="Cancel invitation"
        cancelLabel="Keep it"
        destructive
        onConfirm={async () => {
          if (pendingCancel) await handleCancel(pendingCancel);
        }}
      />
    </Card>
  );
}
