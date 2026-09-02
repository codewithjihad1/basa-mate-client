"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { normalizeApiError } from "@/lib/api/errors";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * The standard failure surface. It renders only the normalized message, so a raw
 * backend stack trace can never reach the screen (frontend-requirements §23).
 */
export function ErrorState({ error, title, onRetry, className }: ErrorStateProps) {
  const normalized = normalizeApiError(error);

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title ?? "Something went wrong"}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{normalized.message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
