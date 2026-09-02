import { DEFAULT_CURRENCY } from "@/config/constants";
import type { MoneyString } from "@/types/api";

/**
 * The single money formatter for the whole app (frontend-requirements §29).
 *
 * The API serializes money as numeric strings; parse once here rather than doing
 * arithmetic on the raw values at call sites.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
};

export function currencySymbol(currency = DEFAULT_CURRENCY): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? `${currency.toUpperCase()} `;
}

/** Parse an API money string into a number. Returns 0 for null/blank/NaN. */
export function parseMoney(value: MoneyString | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export interface FormatMoneyOptions {
  currency?: string;
  /** Render as `+৳1,000` / `-৳500` instead of `৳1,000`. */
  signed?: boolean;
  /** Drop the `.00` on whole amounts. Defaults to true. */
  compactDecimals?: boolean;
}

export function formatMoney(
  value: MoneyString | number | null | undefined,
  options: FormatMoneyOptions = {},
): string {
  const { currency = DEFAULT_CURRENCY, signed = false, compactDecimals = true } = options;
  const amount = parseMoney(value);
  const isWhole = Number.isInteger(amount);
  const fractionDigits = compactDecimals && isWhole ? 0 : 2;

  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  });

  const sign = amount < 0 ? "-" : signed && amount > 0 ? "+" : "";
  return `${sign}${currencySymbol(currency)}${formatted}`;
}

/** Format a meal quantity, which the API also returns as a string (`"2"`). */
export function formatQuantity(value: MoneyString | number | null | undefined): string {
  const amount = parseMoney(value);
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/** Sum a list of API money strings without intermediate string concatenation. */
export function sumMoney(values: Array<MoneyString | number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + parseMoney(value), 0);
}

/** Round to 2dp the way the backend's `Decimal` math does, to compare client previews. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
