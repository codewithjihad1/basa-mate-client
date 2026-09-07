import { ContactForm } from '@/components/marketing/ContactForm';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Mail, MessagesSquare, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact' };

const FAQS = [
    {
        q: 'How do invite links and join codes work?',
        a: 'The basa owner invites roommates by email, or shares a join code anyone can use to request to join.',
    },
    {
        q: 'Who can see and edit records?',
        a: 'Owners and managers review everything. Members record meals, expenses and deposits, which stay pending until approved.',
    },
    {
        q: 'Can I export my data?',
        a: 'Yes. Every cycle can be exported as JSON or CSV from the reports page, for your own records.',
    },
    {
        q: 'Do you take payments or billing info?',
        a: 'No. BasaMate stays out of the money — it only tracks what each roommate has put in, so a host never needs to handle card details.',
    },
];

export default function ContactPage() {
    return (
        <div className="mx-auto w-full max-w-6xl px-4 pb-24">
            <section className="mx-auto max-w-3xl py-20 text-center">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Talk to us</h1>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                    A question about your basa, a settlement that feels off, or an invitation problem — write to us and
                    we&apos;ll reply.
                </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <Card className="flex flex-col">
                    <CardContent className="flex flex-1 flex-col justify-between gap-8 pt-5">
                        <div className="space-y-4">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Mail className="size-5" aria-hidden />
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">Email support</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    For anything that needs a paper trail, email us and we&apos;ll get back to you with
                                    the details sorted.
                                </p>
                            </div>
                            <a
                                href="mailto:basamate002@gmail.com"
                                className="inline-block rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-primary underline-offset-4 hover:border-primary/40 hover:underline">
                                basamate002@gmail.com
                            </a>
                        </div>

                        <dl className="space-y-3 border-t border-border pt-4 text-sm">
                            <div className="flex items-start gap-3">
                                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                                <dd className="text-muted-foreground">
                                    We reply within one business day — usually much faster.
                                </dd>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                                <dd className="text-muted-foreground">
                                    Include the basa name and the cycle month so we can look it up in one step.
                                </dd>
                            </div>
                            <div className="flex items-start gap-3">
                                <MessagesSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                                <dd className="text-muted-foreground">
                                    Settlement questions are easier if you mention who the record was made by.
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-1 pt-5">
                        <h2 className="text-lg font-semibold tracking-tight">Send a message</h2>
                        <p className="text-sm text-muted-foreground">
                            The form opens your mail app with everything pre-filled.
                        </p>
                        <div className="pt-4">
                            <ContactForm />
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="mx-auto mt-20 max-w-3xl">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Before you write</h2>
                    <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                        The answer to four questions people ask us most.
                    </p>
                </div>
                <dl className="mt-8 space-y-3">
                    {FAQS.map(({ q, a }) => (
                        <Card key={q}>
                            <CardContent className="pt-5">
                                <dt className="font-medium">{q}</dt>
                                <dd className="mt-1 text-sm text-muted-foreground">{a}</dd>
                            </CardContent>
                        </Card>
                    ))}
                </dl>
            </section>
        </div>
    );
}
