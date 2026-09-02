"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListNotificationsQuery } from "@/store/api/endpoints/notificationApi";

/** Unread badge in the header; the full centre lives at `/notifications` (§19). */
export function NotificationBell() {
  const { data } = useListNotificationsQuery({ limit: 1 });
  const unread = data?.unreadCount ?? 0;

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link
        href="/notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Bell aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
