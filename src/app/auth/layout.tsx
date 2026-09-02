import Link from "next/link";
import { Suspense } from "react";
import { GuestGuard } from "@/components/providers/GuestGuard";

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    // `GuestGuard` reads `useSearchParams`, which must sit under a Suspense boundary.
    <Suspense>
      <GuestGuard>
        <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
          <Link href="/" className="mb-8 text-xl font-semibold tracking-tight">
            BasaMate
          </Link>
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </GuestGuard>
    </Suspense>
  );
}
