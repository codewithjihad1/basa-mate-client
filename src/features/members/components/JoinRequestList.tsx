"use client";

import { UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { JoinRequestStatusBadge } from "@/components/common/StatusBadge";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useAcceptJoinRequestMutation,
  useListBasaJoinRequestsQuery,
  useRejectJoinRequestMutation,
} from "@/store/api/endpoints/joinRequestApi";
import { getErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/date";
import type { BasaId, JoinRequest } from "@/types/api";

/** Pending/approved/declined join requests, with accept/reject for owners & managers. */
export function JoinRequestList() {
  const { basaId } = useActiveBasa();
  const { canManageMembers } = usePermissions();

  const { data, isLoading, error, refetch } = useListBasaJoinRequestsQuery(
    { basaId: basaId as BasaId },
    { skip: !basaId },
  );
  const [acceptJoinRequest, { isLoading: isAccepting }] = useAcceptJoinRequestMutation();
  const [rejectJoinRequest, { isLoading: isRejecting }] = useRejectJoinRequestMutation();

  const handleAccept = async (request: JoinRequest) => {
    try {
      await acceptJoinRequest({ basaId: basaId as BasaId, requestId: request.id }).unwrap();
      toast.success(`${request.user?.name ?? "This person"} is now a member`);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  const handleReject = async (request: JoinRequest) => {
    try {
      await rejectJoinRequest({ basaId: basaId as BasaId, requestId: request.id }).unwrap();
      toast.success("Join request declined");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  if (error) {
    return <ErrorState error={error} title="Couldn't load join requests" onRetry={refetch} />;
  }

  const requests = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Join requests</CardTitle>
        <CardDescription>
          People who asked to join this basa using its join code.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <TableSkeleton columns={5} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={UserRoundPlus}
            title="No join requests"
            description="Share your basa's join code and requests will appear here for approval."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Requester</TableHead>
                <TableHead scope="col">Note</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Submitted</TableHead>
                <TableHead scope="col" className="w-32">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="font-medium">
                      {request.user?.name ?? "Unknown"}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {request.user?.email}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-64">
                    {request.note ? (
                      <span className="line-clamp-2 text-sm text-muted-foreground">
                        {request.note}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <JoinRequestStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </TableCell>
                  <TableCell>
                    {canManageMembers && request.status === "PENDING" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isAccepting || isRejecting}
                          onClick={() => handleAccept(request)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={isAccepting || isRejecting}
                          onClick={() => handleReject(request)}
                        >
                          Decline
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
    </Card>
  );
}
