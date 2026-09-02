"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Keeps unauthenticated visitors out of the app shell (frontend-requirements §32).
 *
 * This is a usability guard, not a security boundary: the tokens are HttpOnly and
 * every protected read goes to the API, which authorizes independently. It renders
 * a splash rather than the page while the session bootstrap is still resolving, so
 * a signed-in user reloading the page never flashes the login screen.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isResolving, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      // Preserve where they were headed so login can return them there.
      const next = encodeURIComponent(pathname);
      router.replace(`/auth/login?next=${next}`);
    }
  }, [status, pathname, router]);

  if (isResolving || !isAuthenticated) {
    return <FullPageSpinner label="Loading your basa…" />;
  }

  return <>{children}</>;
}

export function FullPageSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3" role="status">
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
