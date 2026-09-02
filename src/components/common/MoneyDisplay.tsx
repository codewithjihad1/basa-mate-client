"use client";

import { cn } from "@/lib/utils/cn";
import { formatMoney, parseMoney } from "@/lib/utils/money";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import type { MoneyString } from "@/types/api";

interface MoneyDisplayProps {
  value: MoneyString | number | null | undefined;
  /** Overrides the active basa's currency (e.g. rendering another basa's figure). */
  currency?: string;
  /** Render `+`/`-` and colour by sign — for balances, not for plain totals. */
  signed?: boolean;
  className?: string;
}

/**
 * The only component that renders money (frontend-requirements §29).
 *
 * Currency comes from the active basa, so a basa configured in USD never shows ৳.
 */
export function MoneyDisplay({ value, currency, signed = false, className }: MoneyDisplayProps) {
  const { currency: basaCurrency } = useActiveBasa();
  const amount = parseMoney(value);
  const resolved = currency ?? basaCurrency;

  return (
    <span
      className={cn(
        "tabular",
        signed && amount > 0 && "text-[var(--success)]",
        signed && amount < 0 && "text-destructive",
        className,
      )}
    >
      {formatMoney(value, { currency: resolved, signed })}
    </span>
  );
}
