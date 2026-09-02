import { AuthGuard } from "@/components/providers/AuthGuard";

/**
 * Session-only pages that don't require an active basa, such as tracking
 * join requests the user has submitted (which can exist before membership).
 */
export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <div className="mx-auto w-full max-w-3xl px-4 py-8">{children}</div>
    </AuthGuard>
  );
}
