import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBasket,
  Receipt,
  Wallet,
  Scale,
  FileBarChart,
  Users,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden when the active role lacks this permission. */
  permission?: Permission;
  /** Shown in the mobile bottom bar (max 5, so only the essentials). */
  primary?: boolean;
}

/** The single source of truth for both the sidebar and the mobile nav (§6). */
export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed, primary: true },
  { href: "/bazaar", label: "Bazaar", icon: ShoppingBasket, primary: true },
  { href: "/expenses", label: "Shared expenses", icon: Receipt },
  { href: "/deposits", label: "Deposits", icon: Wallet, permission: "view_settlement" },
  { href: "/settlement", label: "Settlement", icon: Scale, permission: "view_settlement", primary: true },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/members", label: "Members", icon: Users, primary: true },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

/** `/meals/history` should still light up the `/meals` item. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
