"use client";

import { useCallback, useMemo } from "react";
import { useActiveBasa } from "./useActiveBasa";
import { can, isManagerOrAbove, isOwner, type Permission } from "@/lib/permissions";

/**
 * Role-derived UI gating for the active basa (frontend-requirements §2).
 * Hiding an action here is a courtesy, not a security boundary.
 */
export function usePermissions() {
  const { role } = useActiveBasa();

  const check = useCallback((permission: Permission) => can(role, permission), [role]);

  return useMemo(
    () => ({
      role,
      can: check,
      isOwner: isOwner(role),
      isManager: isManagerOrAbove(role),
      canManageMembers: can(role, "manage_members"),
      canAddMeals: can(role, "add_meals"),
      canEditOthersMeals: can(role, "edit_others_meals"),
      canWriteExpenses: can(role, "add_expense"),
      canManageDeposits: can(role, "manage_deposits"),
      /** OWNER or MANAGER — can approve/reject member-created expenses. */
      canReviewExpenses: isManagerOrAbove(role),
      /** OWNER or MANAGER — can approve/reject member-recorded deposits. */
      canReviewDeposits: isManagerOrAbove(role),
      canFinalizeSettlement: can(role, "finalize_settlement"),
      canEditSettings: can(role, "basa_settings"),
    }),
    [role, check],
  );
}
