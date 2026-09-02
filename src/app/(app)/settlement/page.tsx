import type { Metadata } from "next";
import { SettlementView } from "@/features/settlement/components/SettlementView";

export const metadata: Metadata = { title: "Settlement" };

export default function SettlementPage() {
  return <SettlementView />;
}
