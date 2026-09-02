"use client";

import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";

interface RoleGateProps {
  permission: Permission;
  children: React.ReactNode;
  /** Shown instead of the children when the role lacks the permission. */
  fallback?: React.ReactNode;
}

/**
 * Hides an action the current role cannot perform (frontend-requirements §2).
 *
 * This is presentation only — the server rejects the request regardless, so never
 * rely on this gate to protect anything.
 */
export function RoleGate({ permission, children, fallback = null }: RoleGateProps) {
  const { can } = usePermissions();
  return <>{can(permission) ? children : fallback}</>;
}
