"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "./Pagination";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { TableSkeleton } from "./LoadingSkeleton";
import { cn } from "@/lib/utils/cn";
import type { Paginated } from "@/types/api";

/**
 * The single table surface for every list in the app (frontend-requirements §11, §13, §17).
 *
 * It owns the four states every async list needs — error, loading, empty and the
 * populated rows — plus pagination when the endpoint paginates, so a feature table
 * only has to describe its columns:
 *
 * ```tsx
 * <DataTable
 *   columns={[
 *     { header: "Roommate", cell: (member) => member.user?.name },
 *     { header: "Amount", align: "right", cell: (deposit) => <MoneyDisplay value={deposit.amount} /> },
 *   ]}
 *   rows={deposits}
 *   rowKey={(deposit) => deposit.id}
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   emptyIcon={Wallet}
 *   emptyMessage="No deposits yet."
 * />
 * ```
 *
 * Keep the wrapper (Card, filters, dialogs) in the caller; this renders only the
 * table area so it stays composable.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  busy = false,
  error,
  onRetry,
  errorTitle = "Couldn't load this list",
  emptyIcon,
  emptyMessage = "Nothing here yet.",
  emptyDescription,
  emptyAction,
  emptyClassName,
  loadingColumns,
  loadingRows = 5,
  pagination,
  onPageChange,
  itemLabel,
  footer,
  rowClassName,
  className,
}: DataTableProps<T>) {
  const columnCount = columns.length;

  if (error) {
    return <ErrorState error={error} title={errorTitle} onRetry={onRetry} />;
  }

  if (isLoading) {
    return <TableSkeleton columns={loadingColumns ?? columnCount} rows={loadingRows} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyMessage}
        description={emptyDescription}
        action={emptyAction}
        className={cn("border-0", emptyClassName)}
      />
    );
  }

  return (
    <div aria-busy={busy} className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                scope="col"
                className={cn(alignClass(column.align), column.headerClassName)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} className={rowClassName?.(row)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    alignClass(column.align),
                    column.align === "right" && "tabular",
                    column.cellClassName,
                  )}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>

        {footer ? <TableFooter>{footer}</TableFooter> : null}
      </Table>

      {pagination && onPageChange ? (
        <Pagination pagination={pagination} onPageChange={onPageChange} itemLabel={itemLabel} />
      ) : null}
    </div>
  );
}

export interface DataTableColumn<T> {
  /** Stable identifier for the column; also the React key. */
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Show the loading skeleton instead of rows. */
  isLoading?: boolean;
  /** Set `aria-busy` while a refetch is in flight (keeps the old rows visible). */
  busy?: boolean;
  error?: unknown;
  onRetry?: () => void;
  errorTitle?: string;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  emptyClassName?: string;
  loadingColumns?: number;
  loadingRows?: number;
  pagination?: Paginated<unknown>["pagination"];
  onPageChange?: (page: number) => void;
  itemLabel?: string;
  /** Rendered inside the `<tfoot>`, e.g. a totals row. */
  footer?: ReactNode;
  /** Optional per-row classes, e.g. dimming inactive or deleted rows. */
  rowClassName?: (row: T) => string | undefined;
  className?: string;
}

function alignClass(align: DataTableColumn<unknown>["align"]): string {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}