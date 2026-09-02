import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { FormSkeleton } from "@/components/common/LoadingSkeleton";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<FormSkeleton fields={2} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
