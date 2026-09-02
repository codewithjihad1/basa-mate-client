import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Billing" };

/**
 * frontend-requirements §20 describes a billing dashboard, but the API has no
 * subscription, plan or invoice endpoints — `SUBSCRIPTION_LIMIT_REACHED` is defined
 * and never enforced (docs/API.md §Known gaps). Rather than render a dashboard of
 * invented figures, this states plainly where things stand.
 *
 * When the endpoints ship, add a `subscriptionApi` alongside the others and replace
 * this page with the plan / usage / invoice sections from §20.
 */
export default function BillingPage() {
  return (
    <>
      <PageHeader title="Billing" description="Your basa's plan and payment history." />

      <Card>
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="size-5" aria-hidden />
          </span>
          <CardTitle className="text-base">Every basa is currently free</CardTitle>
          <CardDescription>
            Subscriptions aren&apos;t live yet, so there&apos;s no plan to manage and nothing to pay.
            Plan limits are not enforced.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/pricing">See planned pricing</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
