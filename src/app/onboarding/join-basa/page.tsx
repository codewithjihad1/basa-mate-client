"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinRequestForm } from "@/features/members/components/JoinRequestForm";

export default function JoinBasaPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/onboarding"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Join a basa</CardTitle>
          <CardDescription>
            Enter the basa&apos;s join code to request membership. The owner or manager will review
            your request before you&apos;re added.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinRequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
