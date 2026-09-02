import { z } from "zod";

/**
 * Shared field schemas. Every rule here mirrors the server's own validation
 * (docs/API.md) so the client rejects the same input the server would, rather than
 * inventing a stricter or looser rule that would surprise the user.
 *
 * Numeric fields are modelled as **string in, number out**. HTML inputs only ever
 * produce strings, so this keeps the form's input type honest (`z.input`) while the
 * submit handler receives real numbers (`z.output`) ready for the API. That split is
 * why forms are typed `useForm<Input, unknown, Values>`.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email must be at most 255 characters")
  .email("Enter a valid email address")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters");

/** A required text input parsed to a finite number. */
export function numericField(options: { required?: string; invalid?: string } = {}) {
  const { required = "This field is required", invalid = "Enter a valid number" } = options;

  return z
    .string()
    .trim()
    .min(1, required)
    .transform((value, ctx) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: invalid });
        return z.NEVER;
      }
      return parsed;
    });
}

/** A positive money amount, e.g. an expense or deposit. */
export const amountSchema = numericField({
  required: "Amount is required",
  invalid: "Enter a valid amount",
}).refine((value) => value > 0, "Amount must be greater than 0");

/** `yyyy-MM-dd` from a native date input. */
export const dateSchema = z
  .string()
  .min(1, "Date is required")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date");

/** Optional free text: blank becomes `undefined` so it is omitted from the payload. */
export const optionalText = (max: number, label = "This field") =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .transform((value) => (value ? value : undefined));

export const basaRoleSchema = z.enum(["OWNER", "MANAGER", "MEMBER", "VIEWER"]);
export const paymentMethodSchema = z.enum(["CASH", "BKASH", "NAGAD", "BANK", "OTHER"]);
export const expenseTypeSchema = z.enum(["GROCERY", "SHARED", "OTHER"]);
export const allocationMethodSchema = z.enum(["EQUAL", "CUSTOM_AMOUNT", "PERCENTAGE"]);
