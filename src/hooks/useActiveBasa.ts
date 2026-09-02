"use client";

import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveBasa } from "@/store/slices/workspaceSlice";
import { useGetBasaQuery, useListBasasQuery } from "@/store/api/endpoints/basaApi";
import { DEFAULT_CURRENCY } from "@/config/constants";
import type { BasaId, BasaRole } from "@/types/api";

/**
 * The active basa, the caller's role in it, and its reference data.
 *
 * The role comes from the freshly-fetched basa, never from storage — it is used
 * only to hide actions, and the server enforces the real rule on every request.
 */
export function useActiveBasa() {
  const dispatch = useAppDispatch();
  const activeBasaId = useAppSelector((state) => state.workspace.activeBasaId);
  const hydrated = useAppSelector((state) => state.workspace.hydrated);
  const currentUserId = useAppSelector((state) => state.auth.user?.id);

  const membershipsQuery = useListBasasQuery();
  const basaQuery = useGetBasaQuery(activeBasaId as BasaId, { skip: !activeBasaId });

  const basa = basaQuery.data ?? null;

  const membership = useMemo(
    () => basa?.members?.find((member) => member.userId === currentUserId) ?? null,
    [basa, currentUserId],
  );

  const activeMembers = useMemo(
    () => basa?.members?.filter((member) => member.status === "ACTIVE") ?? [],
    [basa],
  );

  return {
    basaId: activeBasaId,
    basa,
    /** The caller's own membership row — its `id` is the member id most writes need. */
    membership,
    memberId: membership?.id ?? null,
    role: (membership?.role ?? null) as BasaRole | null,
    members: activeMembers,
    mealTypes: basa?.mealTypes?.filter((type) => type.isActive) ?? [],
    expenseCategories: basa?.expenseCategories?.filter((category) => category.isActive) ?? [],
    currency: basa?.currency ?? DEFAULT_CURRENCY,
    memberships: membershipsQuery.data ?? [],
    /** True once we know whether the user has any basa at all. */
    isResolved: hydrated && !membershipsQuery.isLoading,
    hasNoBasa: hydrated && membershipsQuery.isSuccess && membershipsQuery.data.length === 0,
    isLoading: basaQuery.isLoading || membershipsQuery.isLoading,
    error: basaQuery.error ?? membershipsQuery.error,
    switchBasa: (id: BasaId | null) => dispatch(setActiveBasa(id)),
  };
}
