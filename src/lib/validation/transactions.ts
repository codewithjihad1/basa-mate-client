import { z } from "zod";
import {
  allocationMethodSchema,
  amountSchema,
  dateSchema,
  expenseTypeSchema,
  numericField,
  optionalText,
  paymentMethodSchema,
} from "./common";
import { roundMoney } from "@/lib/utils/money";

// ---------------------------------------------------------------------------
// Meals
// ---------------------------------------------------------------------------

export const mealEntrySchema = z.object({
  mealTypeId: z.string().min(1),
  // Fractions are allowed (a half portion); the server caps quantity at 1000.
  quantity: numericField({ required: "Enter 0 if none", invalid: "Enter a number" })
    .refine((value) => value >= 0, "Cannot be negative")
    .refine((value) => value <= 1000, "That's more than 1000 meals"),
});

export const mealFormSchema = z
  .object({
    /** The eater's **user id** — what `POST /meals` expects (docs/API.md §IDs). */
    memberId: z.string().min(1, "Choose who ate"),
    date: dateSchema,
    entries: z.array(mealEntrySchema).min(1, "Add at least one meal type"),
  })
  .refine((values) => values.entries.some((entry) => entry.quantity > 0), {
    message: "Enter at least one meal before saving",
    path: ["entries"],
  });

export const updateMealSchema = z.object({
  quantity: numericField({ required: "Quantity is required", invalid: "Enter a number" })
    .refine((value) => value > 0, "Quantity must be greater than 0")
    .refine((value) => value <= 1000, "That's more than 1000 meals"),
  note: optionalText(500, "Note"),
});

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

const allocationInputSchema = z.object({
  memberId: z.string().min(1),
  /** Whether this member is included in the split at all. */
  included: z.boolean(),
  // Blank is allowed while the user is still filling the split in; the superRefine
  // below is what enforces the total, exactly as the server does.
  amount: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() !== "" ? Number(value) : undefined)),
  percentage: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() !== "" ? Number(value) : undefined)),
});

/**
 * The expense form covers all three types.
 *
 * Allocation totals are checked here so the user sees the mismatch as they type,
 * but the server re-validates and remains authoritative (frontend-requirements §12).
 * The tolerances match the server's: exact for amounts, ±0.0001 for percentages.
 */
export const expenseFormSchema = z
  .object({
    type: expenseTypeSchema,
    amount: amountSchema,
    date: dateSchema,
    description: optionalText(500, "Description"),
    categoryId: z.string().optional(),
    /** The payer's **member id**. */
    paidByMemberId: z.string().optional(),
    receiptUrl: z
      .string()
      .trim()
      .url("Enter a valid URL")
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : undefined)),
    notes: optionalText(1000, "Notes"),
    allocationMethod: allocationMethodSchema.optional(),
    allocations: z.array(allocationInputSchema).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type !== "SHARED") return;

    if (!values.allocationMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocationMethod"],
        message: "Choose how to split this expense",
      });
      return;
    }

    const included = (values.allocations ?? []).filter((allocation) => allocation.included);

    if (included.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocations"],
        message: "Select at least one member to split between",
      });
      return;
    }

    if (values.allocationMethod === "CUSTOM_AMOUNT") {
      const total = roundMoney(
        included.reduce((sum, allocation) => sum + (allocation.amount ?? 0), 0),
      );
      if (total !== roundMoney(values.amount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["allocations"],
          message: `Allocations add up to ${total}, but the expense is ${values.amount}`,
        });
      }
    }

    if (values.allocationMethod === "PERCENTAGE") {
      const total = included.reduce((sum, allocation) => sum + (allocation.percentage ?? 0), 0);
      if (Math.abs(total - 100) > 0.0001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["allocations"],
          message: `Percentages add up to ${total}%, but must total 100%`,
        });
      }
    }
  });

// ---------------------------------------------------------------------------
// Deposits
// ---------------------------------------------------------------------------

export const depositFormSchema = z.object({
  /** The depositor's **member id** — unlike meals (docs/API.md §IDs). */
  memberId: z.string().min(1, "Choose a roommate"),
  amount: amountSchema,
  transactionDate: dateSchema,
  paymentMethod: paymentMethodSchema,
  reference: optionalText(255, "Reference"),
  notes: optionalText(1000, "Notes"),
});

export type MealFormInputValues = z.input<typeof mealFormSchema>;
export type MealFormValues = z.output<typeof mealFormSchema>;
export type UpdateMealInputValues = z.input<typeof updateMealSchema>;
export type UpdateMealValues = z.output<typeof updateMealSchema>;
export type ExpenseFormInputValues = z.input<typeof expenseFormSchema>;
export type ExpenseFormValues = z.output<typeof expenseFormSchema>;
export type AllocationInputValues = z.input<typeof allocationInputSchema>;
export type DepositFormInputValues = z.input<typeof depositFormSchema>;
export type DepositFormValues = z.output<typeof depositFormSchema>;
