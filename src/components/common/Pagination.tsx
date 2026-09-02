"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Paginated } from "@/types/api";

interface PaginationProps {
  pagination: Paginated<unknown>["pagination"];
  onPageChange: (page: number) => void;
  /** What the rows are, for the "Showing 1–20 of 42 expenses" summary. */
  itemLabel?: string;
}

export function Pagination({ pagination, onPageChange, itemLabel = "results" }: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  if (total === 0) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="tabular font-medium text-foreground">{first}–{last}</span> of{" "}
        <span className="tabular font-medium text-foreground">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft aria-hidden />
          Previous
        </Button>
        <span className="tabular text-sm text-muted-foreground" aria-current="page">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
