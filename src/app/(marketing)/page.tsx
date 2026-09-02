import Link from "next/link";
import { ArrowRight, Scale, UtensilsCrossed, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HIGHLIGHTS = [
  {
    icon: UtensilsCrossed,
    title: "Meals, counted once",
    body: "Everyone logs breakfast, lunch and dinner. The meal rate falls out of the numbers.",
  },
  {
    icon: Wallet,
    title: "Bazaar and deposits",
    body: "Record who paid for groceries and who put money into the fund, with receipts.",
  },
  {
    icon: Scale,
    title: "Settlement without arguments",
    body: "At month end, see exactly who gets a refund and who still owes.",
  },
];

export default function MarketingHomePage() {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Settle the month without the spreadsheet
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          BasaMate tracks meals, bazaar spending, shared bills and deposits for your basa, then
          works out who owes what.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/auth/register">
              Start free
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/features">See how it works</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-20 md:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
