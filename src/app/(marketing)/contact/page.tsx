import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-16">
      <PageHeader
        title="Contact"
        description="Questions about your basa, billing or an invitation?"
      />
      <p className="text-sm text-muted-foreground">
        Email{" "}
        <a className="font-medium text-primary underline-offset-4 hover:underline" href="mailto:support@basamate.app">
          support@basamate.app
        </a>{" "}
        and we&apos;ll get back to you.
      </p>
    </div>
  );
}
