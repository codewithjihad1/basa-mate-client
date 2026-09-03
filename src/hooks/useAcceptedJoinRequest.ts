"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveBasa } from "@/store/slices/workspaceSlice";
import { useListBasasQuery } from "@/store/api/endpoints/basaApi";
import { useListMyJoinRequestsQuery } from "@/store/api/endpoints/joinRequestApi";
import type { JoinRequest } from "@/types/api";

/** How often to re-check while the user is sitting on the waiting screen. */
const POLL_INTERVAL_MS = 15_000;

/**
 * Sends the user into their new basa as soon as a join request is approved.
 *
 * Acceptance happens on the owner's side, so the requester has no event to react
 * to — this polls their own requests and, on the newest accepted one, makes that
 * basa active and replaces the waiting screen with the dashboard.
 *
 * A request whose basa is already active is ignored: the user is working in that
 * basa and only came here to look at their history.
 *
 * Memberships are refetched *before* redirecting, otherwise `BasaGuard` would
 * still see the stale (empty) membership list and bounce them back to onboarding.
 */
export function useAcceptedJoinRequest() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activeBasaId = useAppSelector((state) => state.workspace.activeBasaId);
  const { data } = useListMyJoinRequestsQuery(undefined, { pollingInterval: POLL_INTERVAL_MS });
  const { refetch: refetchMemberships } = useListBasasQuery();

  // Redirecting is one-way; without this the effect can re-fire mid-navigation.
  const redirecting = useRef(false);

  useEffect(() => {
    if (redirecting.current || !data) return;

    const accepted = newestAccepted(data);
    const basaId = accepted?.basa?.id;
    if (!basaId || basaId === activeBasaId) return;

    redirecting.current = true;

    void (async () => {
      try {
        await refetchMemberships().unwrap();
      } catch {
        // A failed refetch is not fatal — the basa page fetches what it needs.
      }
      dispatch(setActiveBasa(basaId));
      toast.success(
        accepted?.basa?.name
          ? `You've joined ${accepted.basa.name}`
          : "Your join request was approved",
      );
      router.replace("/dashboard");
    })();
  }, [data, activeBasaId, dispatch, refetchMemberships, router]);
}

/** The list is newest-first, so the first accepted row is the most recent one. */
function newestAccepted(requests: JoinRequest[]) {
  return requests.find((request) => request.status === "ACCEPTED") ?? null;
}
