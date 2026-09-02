import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { NotificationList } from "@/features/notifications/components/NotificationList";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" description="Everything that needs your attention." />
      <NotificationList />
    </>
  );
}
