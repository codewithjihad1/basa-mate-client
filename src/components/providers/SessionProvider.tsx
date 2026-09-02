"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUnauthenticated } from "@/store/slices/authSlice";
import { setActiveBasa } from "@/store/slices/workspaceSlice";
import { useGetMeQuery } from "@/store/api/endpoints/authApi";
import { useListBasasQuery } from "@/store/api/endpoints/basaApi";
import { readPersistedBasaId } from "@/store/persistence";

/**
 * Boots the session on first paint.
 *
 * `GET /auth/me` is the only source of truth for "am I signed in": if the access
 * token has expired, `baseQuery` silently refreshes from the HttpOnly cookie and
 * retries, so a reload restores the session without ever having stored a token.
 * A 401 that survives the refresh means there is genuinely no session.
 *
 * It then resolves the active basa: the persisted id if the user is still a member
 * of it, otherwise their only basa, otherwise nothing (which sends them to onboarding).
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const { activeBasaId, hydrated } = useAppSelector((state) => state.workspace);

  const { isError: meFailed, isSuccess: meLoaded } = useGetMeQuery();

  // Memberships are only worth fetching once we know there is a user.
  const { data: memberships } = useListBasasQuery(undefined, { skip: !meLoaded });

  useEffect(() => {
    if (meFailed && status !== "unauthenticated") {
      dispatch(setUnauthenticated());
    }
  }, [meFailed, status, dispatch]);

  useEffect(() => {
    if (!memberships || hydrated) return;

    const ids = new Set(memberships.map((membership) => membership.basa.id));
    const persisted = readPersistedBasaId();

    if (persisted && ids.has(persisted)) {
      dispatch(setActiveBasa(persisted));
    } else if (memberships.length > 0) {
      dispatch(setActiveBasa(memberships[0].basa.id));
    } else {
      dispatch(setActiveBasa(null));
    }
  }, [memberships, hydrated, activeBasaId, dispatch]);

  return <>{children}</>;
}
