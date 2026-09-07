'use client';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable } from '@/components/common/DataTable';
import { MoneyDisplay } from '@/components/common/MoneyDisplay';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';
import { useActiveBasa } from '@/hooks/useActiveBasa';
import { useActiveCycle } from '@/hooks/useActiveCycle';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/api/errors';
import { formatDate } from '@/lib/utils/date';
import {
    useDeleteExpenseMutation,
    useListExpensesQuery,
    useReviewExpenseMutation,
} from '@/store/api/endpoints/expenseApi';
import type { ApprovalStatus, BasaId, CycleId, Expense, ExpenseType } from '@/types/api';
import { Check, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

const ALL = '__all__';

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
    const { canWriteExpenses, canReviewExpenses } = usePermissions();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState(ALL);
    const [paidBy, setPaidBy] = useState(ALL);
    const [status, setStatus] = useState(ALL);
    const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

    const debouncedSearch = useDebouncedValue(search);
    const [deleteExpense] = useDeleteExpenseMutation();
    const [reviewExpense, { isLoading: isReviewing }] = useReviewExpenseMutation();

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
            status: status === ALL ? undefined : (status as ApprovalStatus),
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
            toast.success('Expense deleted');
        } catch (caught) {
            toast.error(getErrorMessage(caught));
        }
    };

    const handleReview = async (expense: Expense, action: 'approve' | 'reject') => {
        try {
            await reviewExpense({
                basaId: basaId as BasaId,
                cycleId: cycleId as CycleId,
                expenseId: expense.id,
                action,
            }).unwrap();
            toast.success(action === 'approve' ? 'Expense approved' : 'Expense rejected');
        } catch (caught) {
            toast.error(getErrorMessage(caught));
        }
    };

    const expenses = data?.items ?? [];

    return (
        <Card>
            <CardContent className="space-y-4 pt-5">
                <div className="grid gap-4 lg:grid-cols-4">
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
                            }}>
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
                            }}>
                            <SelectTrigger id="expense-payer">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Anyone</SelectItem>
                                {members.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.user?.name ?? 'Unknown'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="expense-status">Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value) => {
                                setStatus(value);
                                setPage(1);
                            }}>
                            <SelectTrigger id="expense-status">
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
                </div>

                <DataTable
                    columns={[
                        { key: 'date', header: 'Date', cell: (expense) => <span className="whitespace-nowrap">{formatDate(expense.date)}</span> },
                        { key: 'description', header: 'Description', cell: (expense) => expense.description || '—', cellClassName: 'max-w-56 truncate' },
                        {
                            key: 'category',
                            header: 'Category',
                            cell: (expense) =>
                                expense.category ? (
                                    <Badge variant="outline">{expense.category.name}</Badge>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                ),
                        },
                        { key: 'paidBy', header: 'Paid by', cell: (expense) => expense.paidBy?.user?.name ?? '—' },
                        {
                            key: 'status',
                            header: 'Status',
                            cell: (expense) => <ApprovalStatusBadge status={expense.approvalStatus} />,
                        },
                        { key: 'amount', header: 'Amount', align: 'right', cell: (expense) => <MoneyDisplay value={expense.amount} /> },
                        {
                            key: 'actions',
                            header: <span className="sr-only">Actions</span>,
                            headerClassName: 'w-64',
                            cell: (expense) =>
                                canReviewExpenses || expense.approvalStatus === 'PENDING' ? (
                                    <div className="flex justify-end gap-1">
                                        {expense.approvalStatus === 'PENDING' && canReviewExpenses ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={isClosed || isReviewing}
                                                aria-label={`Approve ${expense.description || 'expense'}`}
                                                onClick={() => handleReview(expense, 'approve')}>
                                                <Check className="text-success" aria-hidden />
                                            </Button>
                                        ) : null}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            disabled={isClosed}
                                            aria-label={`Edit ${expense.description || 'expense'}`}>
                                            <Link href={`${basePath}/${expense.id}`}>
                                                <Pencil aria-hidden />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isClosed}
                                            aria-label={`Delete ${expense.description || 'expense'}`}
                                            onClick={() => setPendingDelete(expense)}>
                                            <Trash2 className="text-destructive" aria-hidden />
                                        </Button>
                                    </div>
                                ) : null,
                        },
                    ]}
                    rows={expenses}
                    rowKey={(expense) => expense.id}
                    isLoading={isLoading}
                    busy={isFetching}
                    error={error}
                    onRetry={refetch}
                    errorTitle="Couldn't load expenses"
                    emptyIcon={Receipt}
                    emptyMessage={emptyTitle}
                    emptyAction={
                        canWriteExpenses && !isClosed ? (
                            <Button asChild>
                                <Link href={`${basePath}/new`}>
                                    <Plus aria-hidden />
                                    Add expense
                                </Link>
                            </Button>
                        ) : undefined
                    }
                    pagination={data?.pagination}
                    onPageChange={setPage}
                    itemLabel="expenses"
                />
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
