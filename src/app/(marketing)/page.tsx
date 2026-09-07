import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowRight,
    Check,
    ClipboardCheck,
    FileDown,
    Scale,
    ShieldCheck,
    Sparkles,
    UtensilsCrossed,
    Wallet,
    X,
} from 'lucide-react';
import Link from 'next/link';

const HIGHLIGHTS = [
    {
        icon: UtensilsCrossed,
        title: 'Meals, counted once',
        body: 'Everyone logs breakfast, lunch and dinner on a shared calendar. The meal rate falls out of the numbers.',
    },
    {
        icon: Wallet,
        title: 'Bazaar and deposits',
        body: 'Record who paid for groceries and who put money into the fund — with category, payer and deposit reference.',
    },
    {
        icon: Scale,
        title: 'Settlement without arguments',
        body: "At month end, see exactly who gets a refund and who still owes. Nothing to agree on — it's already worked out.",
    },
];

const BEFORE = [
    'Meals decided in a group chat — “did we eat last night?”',
    'Bazaar receipts scattered across screenshots and memories',
    'Deposits tracked by whoever remembers to note them',
    'Settlement is a lobby discussion that ends in an argument',
];

const AFTER = [
    'Every meal logged once, visible on a monthly calendar',
    'Every bazaar bill categorised and reviewed before it counts',
    'Deposits with amount, method and reference, all in one table',
    'Settlement computed in seconds, with a paper-trail report',
];

const STEPS = [
    { title: 'Track', body: 'Meals, bazaar runs and deposits are recorded as they happen, by whoever does them.' },
    { title: 'Review', body: 'Owners and managers approve or reject the pending entries, so the numbers stay honest.' },
    {
        title: 'Settle',
        body: 'Close the cycle and BasaMate works out every balance — refunds and dues, ready to export.',
    },
];

const ASSURANCES = [
    { icon: ShieldCheck, label: 'Owners and managers approve every entry' },
    { icon: FileDown, label: 'Export any cycle as JSON or CSV' },
    { icon: Sparkles, label: 'Free to start, no card needed' },
];

export default function MarketingHomePage() {
    return (
        <>
            <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:py-24">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Sparkles className="size-3.5 text-primary" aria-hidden />
                    Built for bachelor basas
                </span>
                <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
                    Settle the month without the spreadsheet
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                    BasaMate tracks meals, bazaar spending, shared bills and deposits for your basa, then works out who
                    owes what — no group-chat ledger, no arguments at month end.
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
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

            <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-20 md:grid-cols-2">
                <Card className="bg-muted/40">
                    <CardContent className="pt-5">
                        <h2 className="text-base font-semibold tracking-tight text-muted-foreground">
                            The group-chat ledger
                        </h2>
                        <ul className="mt-4 space-y-3">
                            {BEFORE.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                        <X className="size-3" aria-hidden />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="space-y-4 pt-5">
                        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ClipboardCheck className="size-5" aria-hidden />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold tracking-tight">BasaMate</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Everything in one place, approved and accounted for.
                            </p>
                        </div>
                        <ul className="space-y-3">
                            {AFTER.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Check className="size-3" aria-hidden />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </section>

            <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-20 md:grid-cols-3">
                {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
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

            <section className="mx-auto w-full max-w-6xl px-4 pb-20">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        From first meal to settled month
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                        Three steps between moving in and knowing exactly who owes what.
                    </p>
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {STEPS.map(({ title, body }, index) => (
                        <Card key={title}>
                            <CardContent className="pt-5">
                                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular">
                                    {index + 1}
                                </span>
                                <h3 className="mt-4 font-semibold">{title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="mx-auto w-full max-w-6xl px-4 pb-20">
                <div className="rounded-2xl border border-border bg-primary/5 p-8 text-center sm:p-12">
                    <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
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
                    <ul className="mt-6 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground sm:flex-row sm:gap-6">
                        {ASSURANCES.map(({ icon: Icon, label }) => (
                            <li key={label} className="flex items-center gap-1.5">
                                <Icon className="size-3.5 text-primary" aria-hidden />
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    );
}
