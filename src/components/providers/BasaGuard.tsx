"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { FullPageSpinner } from "./AuthGuard";

/**
 * Every screen inside the app shell is basa-scoped, so a user with no basa is sent
 * to onboarding rather than shown an app with nothing in it (§5).
 */
export function BasaGuard({ children }: { children: React.ReactNode }) {
  const { basaId, hasNoBasa, isResolved } = useActiveBasa();
  const router = useRouter();

  useEffect(() => {
    if (hasNoBasa) router.replace("/onboarding");
  }, [hasNoBasa, router]);

  if (!isResolved || !basaId) return <FullPageSpinner label="Loading your basa…" />;

  return <>{children}</>;
}
