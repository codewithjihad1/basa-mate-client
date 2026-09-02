import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { MyJoinRequests } from "@/features/members/components/MyJoinRequests";

export default function MyJoinRequestsPage() {
  return (
    <>
      <PageHeader
        title="Join requests"
        description="Requests you've sent to join a basa and their status."
        actions={
          <Link
            href="/onboarding/join-basa"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Submit another
          </Link>
        }
      />
      <MyJoinRequests />
    </>
  );
}
