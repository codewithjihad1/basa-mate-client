import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateBasaForm } from "@/features/basa/components/CreateBasaForm";

export const metadata: Metadata = { title: "Create a basa" };

export default function CreateBasaPage() {
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
          <CardTitle>Create a basa</CardTitle>
          <CardDescription>
            You&apos;ll be the owner. Default meal types and expense categories are set up for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateBasaForm />
        </CardContent>
      </Card>
    </div>
  );
}
