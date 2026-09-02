"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { MailOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcceptInvitationMutation } from "@/store/api/endpoints/basaApi";
import { useAppDispatch } from "@/store/hooks";
import { setActiveBasa } from "@/store/slices/workspaceSlice";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/hooks/useAuth";

/**
 * frontend-requirements §5 asks to show invitation details before accepting, but the
 * API has no endpoint to read an invitation by its raw token — the token is only
 * hashed server-side, and the listing route is basa-scoped, which the invitee cannot
 * reach yet. So we confirm the signed-in identity instead, which is the thing that
 * actually decides whether accepting will work.
 */
export function AcceptInvitationCard({ token }: { token: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [acceptInvitation, { isLoading }] = useAcceptInvitationMutation();

  const handleAccept = async () => {
    setError(null);
    try {
      const membership = await acceptInvitation(token).unwrap();
      if (membership.basaId) dispatch(setActiveBasa(membership.basaId));
      toast.success("You've joined the basa");
      router.replace("/dashboard");
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailOpen className="size-5" aria-hidden />
        </span>
        <CardTitle>You&apos;ve been invited to a basa</CardTitle>
        <CardDescription>
          Accepting joins you with the role the manager chose. You&apos;re signed in as{" "}
          <span className="font-medium text-foreground">{user?.email}</span> — the invitation must
          have been sent to this address.
        </CardDescription>
      </CardHeader>

      {error ? (
        <CardContent>
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        </CardContent>
      ) : null}

      <CardFooter className="flex-col gap-2">
        <Button className="w-full" onClick={handleAccept} loading={isLoading}>
          Accept invitation
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/dashboard">Not now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
