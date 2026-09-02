import type { BasaRole, PaymentMethod, ExpenseType, AllocationMethod, JoinRequestStatus } from "@/types/api";

/** Default currency when a basa has not overridden it (frontend-requirements §29). */
export const DEFAULT_CURRENCY = "BDT";

/** Pagination defaults mirroring the backend (`page` = 1, `limit` = 20, max 100). */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ROLE_LABELS: Record<BasaRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank",
  OTHER: "Other",
};

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  GROCERY: "Grocery (bazaar)",
  SHARED: "Shared expense",
  OTHER: "Other",
};

export const ALLOCATION_METHOD_LABELS: Record<AllocationMethod, string> = {
  EQUAL: "Split equally",
  CUSTOM_AMOUNT: "Custom amounts",
  PERCENTAGE: "By percentage",
};

export const JOIN_REQUEST_STATUS_LABELS: Record<JoinRequestStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

/** Keys used for the small amount of state we persist locally (never tokens or roles). */
export const STORAGE_KEYS = {
  activeBasaId: "basamate.activeBasaId",
  theme: "basamate.theme",
} as const;
