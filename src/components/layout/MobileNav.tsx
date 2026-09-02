"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { usePermissions } from "@/hooks/usePermissions";
import { MAIN_NAV, isNavItemActive } from "./navigation";

/**
 * Bottom navigation for small screens. Only `primary` destinations appear, because
 * more than five targets in a thumb-reachable bar stops being reachable (§6, §31).
 */
export function MobileNav() {
  const pathname = usePathname();
  const { can } = usePermissions();

  const items = MAIN_NAV.filter(
    (item) => item.primary && (!item.permission || can(item.permission)),
  ).slice(0, 5);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
