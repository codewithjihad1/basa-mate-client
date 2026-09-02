import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Verify your email" };

/**
 * The API sends a verification email only when `EMAIL_PROVIDER != "console"` or in
 * production, and no route enforces verification (docs/API.md §Known gaps #7). So this
 * is an informational screen rather than a gate — nothing here blocks the user.
 */
export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader>
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-5" aria-hidden />
        </span>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to your inbox. You can keep using BasaMate in the
          meantime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" asChild>
          <Link href="/dashboard">Continue to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
