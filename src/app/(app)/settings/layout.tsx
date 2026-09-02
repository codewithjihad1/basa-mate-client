"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/basa", label: "Basa", managerOnly: true },
  { href: "/settings/notifications", label: "Notifications" },
];

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  const pathname = usePathname();
  const { canEditSettings } = usePermissions();

  const tabs = TABS.filter((tab) => !tab.managerOnly || canEditSettings);

  return (
    <>
      <PageHeader title="Settings" description="Your account and this basa's configuration." />

      <nav aria-label="Settings sections" className="border-b border-border">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-4">{children}</div>
    </>
  );
}
