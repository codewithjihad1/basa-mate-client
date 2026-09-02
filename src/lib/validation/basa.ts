import { z } from "zod";
import { basaRoleSchema, dateSchema, emailSchema, numericField, optionalText } from "./common";

export const createBasaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Basa name must be at least 2 characters")
    .max(100, "Basa name must be at most 100 characters"),
  location: optionalText(255, "Location"),
  // Exactly 3 characters, matching the server's currency rule.
  currency: z.string().trim().length(3, "Use a 3-letter currency code").toUpperCase(),
  cycleStartDay: numericField({ required: "Pick a day of the month" })
    .refine(Number.isInteger, "Pick a whole day of the month")
    .refine((value) => value >= 1 && value <= 28, "Must be between 1 and 28"),
});

export const updateBasaSchema = createBasaSchema.partial();

export const createCycleSchema = z
  .object({
    startDate: dateSchema,
    // Optional: the server defaults to one month minus a day after the start.
    endDate: z.string().optional().or(z.literal("")),
  })
  .refine(
    (values) => !values.endDate || Date.parse(values.endDate) >= Date.parse(values.startDate),
    { message: "End date must be on or after the start date", path: ["endDate"] },
  );

export const reopenCycleSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Give a reason of at least 3 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: basaRoleSchema,
  expiresInDays: numericField({ required: "Choose how long the invite lasts" })
    .refine(Number.isInteger, "Use a whole number of days")
    .refine((value) => value >= 1 && value <= 30, "Must be between 1 and 30 days"),
});

export const updateMemberSchema = z.object({
  role: basaRoleSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreateBasaInputValues = z.input<typeof createBasaSchema>;
export type CreateBasaValues = z.output<typeof createBasaSchema>;
export type UpdateBasaInputValues = z.input<typeof updateBasaSchema>;
export type UpdateBasaValues = z.output<typeof updateBasaSchema>;
export type CreateCycleInputValues = z.input<typeof createCycleSchema>;
export type CreateCycleValues = z.output<typeof createCycleSchema>;
export type ReopenCycleInputValues = z.input<typeof reopenCycleSchema>;
export type ReopenCycleValues = z.output<typeof reopenCycleSchema>;
export type InviteMemberInputValues = z.input<typeof inviteMemberSchema>;
export type InviteMemberValues = z.output<typeof inviteMemberSchema>;
export type UpdateMemberInputValues = z.input<typeof updateMemberSchema>;
export type UpdateMemberValues = z.output<typeof updateMemberSchema>;
