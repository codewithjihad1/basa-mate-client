import type { Metadata } from "next";
import { NotificationSettingsForm } from "@/features/settings/components/NotificationSettingsForm";

export const metadata: Metadata = { title: "Notification settings" };

export default function NotificationSettingsPage() {
  return <NotificationSettingsForm />;
}
