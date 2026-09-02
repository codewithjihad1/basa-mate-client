import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinBasaForm } from "@/features/basa/components/JoinBasaForm";

export const metadata: Metadata = { title: "Join a basa" };

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
            Follow the link in your invitation email, or paste its token below. Your account&apos;s
            email must match the one that was invited.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinBasaForm />
        </CardContent>
      </Card>
    </div>
  );
}
