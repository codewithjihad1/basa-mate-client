import Link from "next/link";
import { AuthGuard } from "@/components/providers/AuthGuard";

export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 text-xl font-semibold tracking-tight">
          BasaMate
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </AuthGuard>
  );
}
