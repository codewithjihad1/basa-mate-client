"use client";

import { ErrorState } from "@/components/common/ErrorState";

export default function AppSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} title="This page couldn't load" onRetry={reset} />;
}
