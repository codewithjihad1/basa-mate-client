import type { Metadata } from "next";
import { BasaSettingsForm } from "@/features/settings/components/BasaSettingsForm";
import { CycleManager } from "@/features/settings/components/CycleManager";
import { JoinCodeCard } from "@/features/settings/components/JoinCodeCard";

export const metadata: Metadata = { title: "Basa settings" };

export default function BasaSettingsPage() {
  return (
    <>
      <BasaSettingsForm />
      <JoinCodeCard />
      <CycleManager />
    </>
  );
}
