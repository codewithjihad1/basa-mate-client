"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveBasa } from "@/hooks/useActiveBasa";

/**
 * Shows the basa's human-readable join code and copies it to the clipboard, so the
 * owner/manager can share it with prospective roommates (docs/API_new.md §Join Requests).
 */
export function JoinCodeCard() {
  const { basa } = useActiveBasa();
  const [copied, setCopied] = useState(false);

  const joinCode = basa?.joinCode;

  const copy = async () => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      toast.success("Join code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the join code");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Join code</CardTitle>
        <CardDescription>
          Share this code with someone so they can request to join this basa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {joinCode ? (
          <div className="flex items-center gap-3">
            <code className="rounded-md border bg-muted px-3 py-1.5 font-mono text-lg tracking-widest">
              {joinCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              aria-label="Copy join code"
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">This basa doesn&apos;t have a join code yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
