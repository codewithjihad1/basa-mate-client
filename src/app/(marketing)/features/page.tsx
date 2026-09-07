import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  Scale,
  ShieldCheck,
  ShoppingCart,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Features" };

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: "Meal tracking",
    body: "Log breakfast, lunch and dinner every day, see the monthly calendar and get per-member summaries.",
  },
  {
    icon: ShoppingCart,
    title: "Bazaar and shared expenses",
    body: "Record grocery runs against a category and a payer, and split shared bills equally, by amount, or by percentage.",
  },
  {
    icon: Wallet,
    title: "Deposits",
    body: "Track cash, bKash, Nagad and bank deposits with the reference for each transfer into the fund.",
  },
  {
    icon: ShieldCheck,
    title: "Accountable by design",
    body: "Member entries start as pending and only count once an owner or manager approves them — no silent changes.",
  },
  {
    icon: Scale,
    title: "Settlement",
    body: "At month end the balances settle themselves: exactly who gets a refund and who still owes.",
  },
  {
    icon: FileDown,
    title: "Reports",
    body: "Export the whole month as JSON or CSV whenever you need a copy of your own records.",
  },
];

const STEPS = [
  {
    title: "1. Track",
    body: "Meals, bazaar runs and deposits are recorded as they happen, by whoever does them.",
  },
  {
    title: "2. Review",
    body: "Owners and managers approve or reject the pending entries, so the numbers stay honest.",
  },
  {
    title: "3. Settle",
    body: "Close the cycle and BasaMate works out every balance — refunds and dues, with nothing to argue over.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24">
      <section className="mx-auto max-w-3xl py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Everything a basa needs to close a month
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Track the daily stuff — meals, groceries, deposits — and let BasaMate do the bookkeeping
          in the background.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="flex flex-col">
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Three steps between moving in and settling the month.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ title, body }) => (
            <Card key={title}>
              <CardContent className="pt-5">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular">
                  {title.split(".")[0]}
                </span>
                <h3 className="mt-4 font-semibold">{title.split(". ")[1]}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20 rounded-2xl border border-border bg-primary/5 p-8 text-center sm:p-12">
        <ClipboardCheck className="mx-auto size-8 text-primary" aria-hidden />
        <h2 className="mx-auto mt-4 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to stop chasing people for money?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Start a basa, invite your roommates and let the month run itself.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/auth/register">
              Start free
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact">Talk to us</Link>
          </Button>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-primary" aria-hidden />
          No credit card. No spreadsheet.
        </p>
      </section>
    </div>
  );
}