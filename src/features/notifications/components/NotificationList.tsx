"use client";

import { useState } from "react";
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  Mail,
  Receipt,
  Scale,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/store/api/endpoints/notificationApi";
import { formatRelative } from "@/lib/utils/date";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";
import type { NotificationType } from "@/types/api";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  INVITATION: Mail,
  MEAL_REMINDER: UtensilsCrossed,
  EXPENSE: Receipt,
  SETTLEMENT: Scale,
  PAYMENT_DUE: CircleDollarSign,
  REFUND: CircleDollarSign,
  SYSTEM: Bell,
};

/** The notification centre (frontend-requirements §19). */
export function NotificationList() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const { data, isLoading, error, refetch } = useListNotificationsQuery({
    page,
    unread: filter === "unread" ? true : undefined,
  });

  const handleMarkAll = async () => {
    try {
      const result = await markAllRead().unwrap();
      toast.success(
        result.count > 0 ? `Marked ${result.count} as read` : "Nothing left to mark as read",
      );
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  if (error) {
    return <ErrorState error={error} title="Couldn't load notifications" onRetry={refetch} />;
  }

  const notifications = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as "all" | "unread");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAll}
          loading={isMarkingAll}
          disabled={unreadCount === 0}
        >
          <CheckCheck aria-hidden />
          Mark all as read
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === "unread" ? "Nothing unread" : "No notifications yet"}
          description="Invitations, settlement updates and payment reminders will show up here."
        />
      ) : (
        <>
          <ul className="space-y-2">
            {notifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] ?? Bell;
              const isUnread = notification.readAt === null;

              return (
                <li key={notification.id}>
                  <Card className={cn(isUnread && "border-primary/40 bg-primary/[0.03]")}>
                    <CardContent className="flex items-start gap-3 pt-5">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{notification.title}</p>
                        {notification.body ? (
                          <p className="text-sm text-muted-foreground">{notification.body}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRelative(notification.createdAt)}
                        </p>
                      </div>

                      {isUnread ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markRead(notification.id)}
                          aria-label={`Mark "${notification.title}" as read`}
                        >
                          Mark read
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>

          {data ? (
            <Pagination
              pagination={data.pagination}
              onPageChange={setPage}
              itemLabel="notifications"
            />
          ) : null}
        </>
      )}
    </>
  );
}
