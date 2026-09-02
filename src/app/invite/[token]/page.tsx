import type { Metadata } from "next";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { AcceptInvitationCard } from "@/features/basa/components/AcceptInvitationCard";

export const metadata: Metadata = { title: "Invitation" };

/**
 * The landing page for an emailed invitation link.
 *
 * `params` is async in Next 16, and the route sits behind `AuthGuard` because
 * `POST /invitations/:token/accept` needs a signed-in user whose email matches
 * the invitation.
 */
export default async function InvitePage(props: PageProps<"/invite/[token]">) {
  const { token } = await props.params;

  return (
    <AuthGuard>
      <div className="flex min-h-dvh items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <AcceptInvitationCard token={token} />
        </div>
      </div>
    </AuthGuard>
  );
}
