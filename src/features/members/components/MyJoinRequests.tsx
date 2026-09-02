"use client";

import { DoorOpen } from "lucide-react";
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
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { JoinRequestStatusBadge } from "@/components/common/StatusBadge";
import { ROLE_LABELS } from "@/config/constants";
import { formatDate } from "@/lib/utils/date";
import { useListMyJoinRequestsQuery } from "@/store/api/endpoints/joinRequestApi";
import type { JoinRequest } from "@/types/api";

/** The authenticated user's own join requests and their progress (docs/API_new.md §Join Requests). */
export function MyJoinRequests() {
  const { data, isLoading, error, refetch } = useListMyJoinRequestsQuery();

  if (error) {
    return <ErrorState error={error} title="Couldn't load your join requests" onRetry={refetch} />;
  }

  const requests = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My join requests</CardTitle>
        <CardDescription>Requests you&apos;ve sent and whether they were approved.</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <TableSkeleton columns={4} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No join requests"
            description="Submit a basa's join code and your request will appear here."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Basa</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Submitted</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {requests.map((request) => (
                <JoinRequestRow key={request.id} request={request} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function JoinRequestRow({ request }: { request: JoinRequest }) {
  return (
    <TableRow>
      <TableCell className="max-w-56 truncate font-medium">
        {request.basa?.name ?? "—"}
        {request.basa?.joinCode ? (
          <span className="ml-2 font-mono text-xs text-muted-foreground">{request.basa.joinCode}</span>
        ) : null}
      </TableCell>
      <TableCell>{request.role ? <Badge variant="outline">{ROLE_LABELS[request.role]}</Badge> : null}</TableCell>
      <TableCell>
        <JoinRequestStatusBadge status={request.status} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDate(request.createdAt)}
      </TableCell>
    </TableRow>
  );
}
