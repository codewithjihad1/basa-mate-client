"use client";

import { useAppSelector } from "@/store/hooks";

/** The signed-in user and whether the boot check has settled. */
export function useAuth() {
  const { user, status } = useAppSelector((state) => state.auth);

  return {
    user,
    status,
    isAuthenticated: status === "authenticated" && user !== null,
    /** True while we still don't know whether there is a session. */
    isResolving: status === "idle" || status === "authenticating",
  };
}
