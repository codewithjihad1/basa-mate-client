"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "./AuthGuard";

/** Bounces an already-signed-in user off the login/register screens. */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isResolving } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isAuthenticated) return;
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
  }, [isAuthenticated, router, searchParams]);

  if (isResolving) return <FullPageSpinner label="Checking your session…" />;

  return <>{children}</>;
}
