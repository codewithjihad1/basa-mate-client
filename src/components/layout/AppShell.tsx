"use client";

import Link from "next/link";
import { AppHeader } from "./AppHeader";
import { SidebarNav } from "./SidebarNav";
import { MobileNav } from "./MobileNav";

/**
 * Sidebar + header on desktop, header + bottom bar on mobile (§6, §31).
 *
 * The bottom padding on `main` keeps the last row of any table clear of the mobile
 * bottom nav, which is fixed and would otherwise cover it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-border p-4 lg:flex">
        <Link href="/dashboard" className="px-3 text-lg font-semibold tracking-tight">
          BasaMate
        </Link>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-6 lg:pb-10">
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
