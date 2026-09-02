"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAcceptInvitationMutation } from "@/store/api/endpoints/basaApi";
import { useAppDispatch } from "@/store/hooks";
import { setActiveBasa } from "@/store/slices/workspaceSlice";
import { normalizeApiError } from "@/lib/api/errors";

/**
 * Accepts an invitation by token.
 *
 * The token is only ever emailed — the API never returns it — so the user either
 * follows the link (which lands on `/invite/[token]`) or pastes the token here.
 * The signed-in account's email must match the one that was invited.
 */
export function JoinBasaForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [acceptInvitation, { isLoading }] = useAcceptInvitationMutation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const membership = await acceptInvitation(token.trim()).unwrap();
      if (membership.basaId) dispatch(setActiveBasa(membership.basaId));
      toast.success("You've joined the basa");
      router.replace("/dashboard");
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="invitation-token">Invitation token</Label>
        <Input
          id="invitation-token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste the token from your invitation email"
          aria-invalid={!!error}
          aria-describedby={error ? "invitation-error" : undefined}
          required
        />
        {error ? (
          <p id="invitation-error" role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" loading={isLoading} disabled={!token.trim()}>
        Join basa
      </Button>
    </form>
  );
}
