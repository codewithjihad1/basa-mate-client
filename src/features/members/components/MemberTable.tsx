"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, initialsOf } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import {
  useListMembersQuery,
  useRemoveMemberMutation,
  useUpdateMemberMutation,
} from "@/store/api/endpoints/basaApi";
import { useGetMealSummaryQuery } from "@/store/api/endpoints/mealApi";
import { useGetSettlementQuery } from "@/store/api/endpoints/settlementApi";
import { ROLE_LABELS } from "@/config/constants";
import { formatDate } from "@/lib/utils/date";
import { getErrorMessage } from "@/lib/api/errors";
import type { BasaId, BasaMember, BasaRole, CycleId } from "@/types/api";

/**
 * The member list with role management (frontend-requirements §17).
 *
 * Meal counts come from the cycle's meal summary and balances from its settlement,
 * so both columns show "—" until those exist rather than inventing a number.
 */
export function MemberTable() {
  const { basaId } = useActiveBasa();
  const { cycleId } = useActiveCycle();
  const { canManageMembers } = usePermissions();
  const { user } = useAuth();

  const [pendingRemove, setPendingRemove] = useState<BasaMember | null>(null);
  const [updateMember] = useUpdateMemberMutation();
  const [removeMember] = useRemoveMemberMutation();

  const membersQuery = useListMembersQuery(basaId as BasaId, { skip: !basaId });
  const scope = { basaId: basaId as BasaId, cycleId: cycleId as CycleId };
  const skipCycle = !basaId || !cycleId;

  const mealSummaryQuery = useGetMealSummaryQuery(scope, { skip: skipCycle });
  const settlementQuery = useGetSettlementQuery(scope, { skip: skipCycle });

  const mealsByMember = useMemo(() => {
    const map = new Map<string, number>();
    (mealSummaryQuery.data?.items ?? []).forEach((item) =>
      map.set(item.memberId, item.totalMeals),
    );
    return map;
  }, [mealSummaryQuery.data]);

  const balanceByMember = useMemo(() => {
    const map = new Map<string, string>();
    (settlementQuery.data?.items ?? []).forEach((item) =>
      map.set(item.memberId, item.finalBalance),
    );
    return map;
  }, [settlementQuery.data]);

  const handleRoleChange = async (member: BasaMember, role: BasaRole) => {
    try {
      await updateMember({ basaId: basaId as BasaId, memberId: member.id, role }).unwrap();
      toast.success(`${member.user?.name ?? "Member"} is now a ${ROLE_LABELS[role].toLowerCase()}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRemove = async (member: BasaMember) => {
    try {
      await removeMember({ basaId: basaId as BasaId, memberId: member.id }).unwrap();
      toast.success(`${member.user?.name ?? "Member"} removed from the basa`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (membersQuery.error) {
    return (
      <ErrorState
        error={membersQuery.error}
        title="Couldn't load members"
        onRetry={membersQuery.refetch}
      />
    );
  }

  const members = membersQuery.data ?? [];

  return (
    <Card>
      <CardContent className="pt-5">
        {membersQuery.isLoading ? (
          <TableSkeleton columns={6} />
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title="No roommates added yet." className="border-0" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Roommate</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Joined</TableHead>
                <TableHead scope="col" className="text-right">Meals</TableHead>
                <TableHead scope="col" className="text-right">Balance</TableHead>
                <TableHead scope="col" className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {members.map((member) => {
                const isSelf = member.userId === user?.id;
                const meals = mealsByMember.get(member.id);
                const balance = balanceByMember.get(member.id);

                return (
                  <TableRow key={member.id} className={member.status === "INACTIVE" ? "opacity-60" : undefined}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback>{initialsOf(member.user?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {member.user?.name ?? "Unknown"}
                            {isSelf ? <span className="text-muted-foreground"> (you)</span> : null}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={member.role === "OWNER" ? "default" : "outline"}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(member.joinedAt)}
                    </TableCell>

                    <TableCell className="text-right tabular">
                      {meals ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>

                    <TableCell className="text-right">
                      {balance !== undefined ? (
                        <MoneyDisplay value={balance} signed />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {canManageMembers && member.status === "ACTIVE" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Actions for ${member.user?.name ?? "member"}`}
                            className="rounded-md p-2 hover:bg-accent"
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change role</DropdownMenuLabel>
                            {(Object.keys(ROLE_LABELS) as BasaRole[]).map((role) => (
                              <DropdownMenuItem
                                key={role}
                                disabled={role === member.role}
                                onSelect={() => handleRoleChange(member, role)}
                              >
                                {ROLE_LABELS[role]}
                              </DropdownMenuItem>
                            ))}
                            {/* The server refuses removing yourself or the last owner. */}
                            {!isSelf ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  destructive
                                  onSelect={() => setPendingRemove(member)}
                                >
                                  <UserMinus aria-hidden />
                                  Remove from basa
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
        title={`Remove ${pendingRemove?.user?.name ?? "this roommate"}?`}
        description={
          <div className="space-y-2">
            <p>
              They lose access to this basa immediately. Their meals, expenses and deposits stay in
              the records so past settlements remain correct.
            </p>
            <p className="font-medium text-foreground">
              Check they have no unsettled balance for the current cycle first.
            </p>
          </div>
        }
        confirmLabel="Remove roommate"
        destructive
        onConfirm={async () => {
          if (pendingRemove) await handleRemove(pendingRemove);
        }}
      />
    </Card>
  );
}
