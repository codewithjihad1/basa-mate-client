import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/** Parse an API ISO timestamp. Returns null rather than an Invalid Date. */
export function parseApiDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? date : null;
}

export function formatDate(value: string | Date | null | undefined, pattern = "dd MMM yyyy"): string {
  const date = parseApiDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, "dd MMM yyyy, h:mm a");
}

export function formatRelative(value: string | Date | null | undefined): string {
  const date = parseApiDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

/** `01 Sep — 30 Sep` for the billing-cycle header (frontend-requirements §9). */
export function formatDateRange(start: string | Date | null, end: string | Date | null): string {
  const from = parseApiDate(start);
  const to = parseApiDate(end);
  if (!from || !to) return "—";
  return `${format(from, "dd MMM")} — ${format(to, "dd MMM")}`;
}

/** `September 2026` — the cycle's display name. */
export function formatCycleTitle(start: string | Date | null): string {
  const date = parseApiDate(start);
  return date ? format(date, "MMMM yyyy") : "Billing cycle";
}

/** `yyyy-MM-dd`, the shape the API's `z.coerce.date()` accepts for date-only fields. */
export function toDateInputValue(value: string | Date | null | undefined): string {
  const date = parseApiDate(value) ?? (value === undefined ? new Date() : null);
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function todayInputValue(): string {
  return format(new Date(), "yyyy-MM-dd");
}
