"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { Pagination } from "@/components/common/Pagination";
import { RoleGate } from "@/components/common/RoleGate";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useDeleteExpenseMutation,
  useListExpensesQuery,
} from "@/store/api/endpoints/expenseApi";
import { formatDate } from "@/lib/utils/date";
import { getErrorMessage } from "@/lib/api/errors";
import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import type { BasaId, CycleId, Expense, ExpenseType } from "@/types/api";

const ALL = "__all__";

interface ExpenseTableProps {
  /** Restricts the list to one type — the bazaar screen passes `GROCERY`. */
  type: ExpenseType;
  /** Base path for the new/edit routes, e.g. `/bazaar`. */
  basePath: string;
  emptyTitle: string;
}

/** The expense list with filters, actions and pagination (§11). */
export function ExpenseTable({ type, basePath, emptyTitle }: ExpenseTableProps) {
  const { basaId, members, expenseCategories } = useActiveBasa();
  const { cycleId, isClosed } = useActiveCycle();
  const { canWriteExpenses } = usePermissions();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState(ALL);
  const [paidBy, setPaidBy] = useState(ALL);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const [deleteExpense] = useDeleteExpenseMutation();

  const { data, isLoading, isFetching, error, refetch } = useListExpensesQuery(
    {
      basaId: basaId as BasaId,
      cycleId: cycleId as CycleId,
      type,
      page,
      limit: DEFAULT_PAGE_SIZE,
      search: debouncedSearch || undefined,
      categoryId: categoryId === ALL ? undefined : categoryId,
      paidBy: paidBy === ALL ? undefined : paidBy,
    },
    { skip: !basaId || !cycleId },
  );

  const handleDelete = async (expense: Expense) => {
    try {
      await deleteExpense({
        basaId: basaId as BasaId,
        cycleId: cycleId as CycleId,
        expenseId: expense.id,
      }).unwrap();
      toast.success("Expense deleted");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  const expenses = data?.items ?? [];

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="expense-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Description…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-category">Category</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="expense-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-payer">Paid by</Label>
            <Select
              value={paidBy}
              onValueChange={(value) => {
                setPaidBy(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="expense-payer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Anyone</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.user?.name ?? "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <ErrorState error={error} title="Couldn't load expenses" onRetry={refetch} />
        ) : isLoading ? (
          <TableSkeleton columns={6} />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={emptyTitle}
            action={
              canWriteExpenses && !isClosed ? (
                <Button asChild>
                  <Link href={`${basePath}/new`}>
                    <Plus aria-hidden />
                    Add expense
                  </Link>
                </Button>
              ) : undefined
            }
            className="border-0"
          />
        ) : (
          <div aria-busy={isFetching}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Date</TableHead>
                  <TableHead scope="col">Description</TableHead>
                  <TableHead scope="col">Category</TableHead>
                  <TableHead scope="col">Paid by</TableHead>
                  <TableHead scope="col" className="text-right">
                    Amount
                  </TableHead>
                  <TableHead scope="col" className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                    <TableCell className="max-w-56 truncate">
                      {expense.description || "—"}
                    </TableCell>
                    <TableCell>
                      {expense.category ? (
                        <Badge variant="outline">{expense.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{expense.paidBy?.user?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay value={expense.amount} />
                    </TableCell>
                    <TableCell>
                      <RoleGate permission="add_expense">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            aria-label={`Edit ${expense.description || "expense"}`}
                          >
                            <Link href={`${basePath}/${expense.id}`}>
                              <Pencil aria-hidden />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isClosed}
                            aria-label={`Delete ${expense.description || "expense"}`}
                            onClick={() => setPendingDelete(expense)}
                          >
                            <Trash2 className="text-destructive" aria-hidden />
                          </Button>
                        </div>
                      </RoleGate>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data ? (
              <Pagination
                pagination={data.pagination}
                onPageChange={setPage}
                itemLabel="expenses"
              />
            ) : null}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this expense?"
        description="It stops counting toward the settlement for this cycle. The record is kept but hidden."
        confirmLabel="Delete expense"
        destructive
        onConfirm={async () => {
          if (pendingDelete) await handleDelete(pendingDelete);
        }}
      />
    </Card>
  );
}
