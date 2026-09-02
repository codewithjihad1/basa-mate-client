import { AuthGuard } from "@/components/providers/AuthGuard";
import { BasaGuard } from "@/components/providers/BasaGuard";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Everything inside this group requires a session *and* an active basa, so both
 * guards sit here rather than being repeated per page.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <BasaGuard>
        <AppShell>{children}</AppShell>
      </BasaGuard>
    </AuthGuard>
  );
}
