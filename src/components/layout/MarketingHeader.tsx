"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "./UserMenu";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/contact", label: "Contact" },
];

/** Marketing navigation that swaps sign-in actions for the user's profile menu. */
export function MarketingHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          BasaMate
        </Link>
        <nav aria-label="Marketing" className="hidden gap-5 sm:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
