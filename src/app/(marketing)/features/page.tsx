import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Features" };

const SECTIONS = [
  {
    title: "Meal tracking",
    body: "Daily entry, a monthly calendar, per-member summaries and a meal rate derived from real grocery spend.",
  },
  {
    title: "Bazaar and shared expenses",
    body: "Log grocery runs against a category and a payer. Split bills equally, by custom amount, or by percentage.",
  },
  {
    title: "Deposits and settlement",
    body: "Record cash, bKash, Nagad and bank deposits, then generate a settlement showing refunds and dues per roommate.",
  },
  {
    title: "Reports",
    body: "Export the month as JSON or CSV for your own records.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-16">
      <PageHeader title="Features" description="Everything a basa needs to close a month." />
      <dl className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <dt className="font-medium">{section.title}</dt>
            <dd className="text-sm text-muted-foreground">{section.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
