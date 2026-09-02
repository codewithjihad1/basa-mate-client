import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Pricing" };

/**
 * frontend-requirements §20 asks for plans loaded from the backend, but the API has
 * no subscription or plan endpoints yet — `SUBSCRIPTION_LIMIT_REACHED` is defined and
 * not enforced (docs/API.md §Known gaps). These plans are therefore hard-coded
 * placeholders. When `GET /plans` ships, replace this constant with an RTK Query
 * endpoint; the rendering below already assumes a list.
 */
const PLANS = [
  {
    name: "Free",
    price: "৳0",
    cadence: "forever",
    description: "For a small basa getting started.",
    features: ["Up to 5 roommates", "Meal and bazaar tracking", "Monthly settlement"],
  },
  {
    name: "Basic",
    price: "৳299",
    cadence: "per month",
    description: "For a full house that closes every month.",
    features: ["Up to 12 roommates", "CSV export", "Invitation management", "Notification centre"],
    featured: true,
  },
  {
    name: "Pro",
    price: "৳799",
    cadence: "per month",
    description: "For managers running more than one basa.",
    features: ["Unlimited roommates", "Multiple basas", "Full reports", "Priority support"],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-16">
      <PageHeader title="Pricing" description="Start free. Upgrade when your basa grows." />

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={plan.featured ? "border-primary shadow-md" : undefined}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-2">
                <span className="text-3xl font-semibold tabular">{plan.price}</span>{" "}
                <span className="text-sm text-muted-foreground">{plan.cadence}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.featured ? "default" : "outline"} asChild>
                <Link href="/auth/register">Choose {plan.name}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
