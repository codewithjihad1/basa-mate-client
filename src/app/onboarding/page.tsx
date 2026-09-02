"use client";

import Link from "next/link";
import { Home, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const CHOICES = [
  {
    href: "/onboarding/create-basa",
    icon: Home,
    title: "Create a basa",
    description: "Set up a new shared house. You'll be its owner.",
  },
  {
    href: "/onboarding/join-basa",
    icon: UserPlus,
    title: "Join a basa",
    description: "Accept an invitation from someone already in a basa.",
  },
];

export default function OnboardingPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Start by creating a basa or joining one you&apos;ve been invited to.
        </p>
      </div>

      <div className="space-y-3">
        {CHOICES.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="block rounded-xl">
            <Card className="transition-colors hover:border-primary hover:bg-accent/40">
              <CardHeader className="flex-row items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="space-y-1">
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">
            A basa is one shared house. Meals, bazaar spending, deposits and settlements all belong
            to a basa, and you can be a member of more than one.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
