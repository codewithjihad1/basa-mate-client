"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { usePermissions } from "@/hooks/usePermissions";
import { MAIN_NAV, SECONDARY_NAV, isNavItemActive, type NavItem } from "./navigation";

interface SidebarNavProps {
  /** Called after a link is followed — closes the mobile drawer. */
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visible = (items: NavItem[]) =>
    items.filter((item) => !item.permission || can(item.permission));

  const renderItem = (item: NavItem) => {
    const active = isNavItemActive(pathname, item.href);
    const Icon = item.icon;

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-6">
      <ul className="space-y-1">{visible(MAIN_NAV).map(renderItem)}</ul>
      <ul className="mt-auto space-y-1 border-t border-border pt-4">
        {visible(SECONDARY_NAV).map(renderItem)}
      </ul>
    </nav>
  );
}
