import type { Metadata } from "next";
import { ProfileForm } from "@/features/settings/components/ProfileForm";

export const metadata: Metadata = { title: "Profile settings" };

export default function ProfileSettingsPage() {
  return <ProfileForm />;
}
