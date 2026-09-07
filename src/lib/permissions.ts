import type { BasaRole } from "@/types/api";

/**
 * Client-side mirror of the server's `ROLE_PERMISSIONS` table (docs/API.md §Roles).
 *
 * This exists **only** to hide actions a user cannot perform. The backend re-checks
 * every request; never treat a `true` here as authorization (frontend-requirements §32).
 */
export type Permission =
  | "view_basa"
  | "manage_members"
  | "add_meals"
  | "edit_own_meals"
  | "edit_others_meals"
  | "add_expense"
  | "manage_deposits"
  | "view_settlement"
  | "finalize_settlement"
  | "basa_settings";

const ROLE_PERMISSIONS: Record<BasaRole, Permission[]> = {
  OWNER: [
    "view_basa",
    "manage_members",
    "add_meals",
    "edit_own_meals",
    "edit_others_meals",
    "add_expense",
    "manage_deposits",
    "view_settlement",
    "finalize_settlement",
    "basa_settings",
  ],
  MANAGER: [
    "view_basa",
    "manage_members",
    "add_meals",
    "edit_own_meals",
    "edit_others_meals",
    "add_expense",
    "manage_deposits",
    "view_settlement",
    "finalize_settlement",
    "basa_settings",
  ],
  // `MEMBER` can create expenses and deposits, but every record they create starts
  // as `PENDING` and only counts toward the settlement once an OWNER or MANAGER
  // approves it (docs/API.md §Roles and permissions). The backend also lets a
  // member edit/delete their own record only while it is still `PENDING`.
  MEMBER: [
    "view_basa",
    "add_meals",
    "edit_own_meals",
    "add_expense",
    "manage_deposits",
    "view_settlement",
  ],
  VIEWER: ["view_basa", "view_settlement"],
};

export function can(role: BasaRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: BasaRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}

/** OWNER or MANAGER — the "manager or above" check used by most write endpoints. */
export function isManagerOrAbove(role: BasaRole | null | undefined): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function isOwner(role: BasaRole | null | undefined): boolean {
  return role === "OWNER";
}
