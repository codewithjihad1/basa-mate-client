"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { RoleGate } from "@/components/common/RoleGate";
import { MemberTable } from "@/features/members/components/MemberTable";
import { InvitationList } from "@/features/members/components/InvitationList";
import { InviteMemberDialog } from "@/features/members/components/InviteMemberDialog";

export default function MembersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Members"
        description="Who's in this basa, what they can do, and where they stand."
        actions={
          <RoleGate permission="manage_members">
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus aria-hidden />
              Invite roommate
            </Button>
          </RoleGate>
        }
      />

      <MemberTable />
      <InvitationList />

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}
