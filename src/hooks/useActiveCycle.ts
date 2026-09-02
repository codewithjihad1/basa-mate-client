"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveCycle } from "@/store/slices/workspaceSlice";
import { useListCyclesQuery } from "@/store/api/endpoints/cycleApi";
import type { BasaId, CycleId } from "@/types/api";

/**
 * The billing cycle every meal, expense, deposit and settlement screen hangs off.
 *
 * Defaults to the basa's `ACTIVE` cycle, falling back to the most recent one so a
 * basa between cycles still shows its last period rather than an empty app.
 */
export function useActiveCycle() {
  const dispatch = useAppDispatch();
  const basaId = useAppSelector((state) => state.workspace.activeBasaId);
  const activeCycleId = useAppSelector((state) => state.workspace.activeCycleId);

  const { data, isLoading, isFetching, error, isSuccess } = useListCyclesQuery(
    { basaId: basaId as BasaId, limit: 24 },
    { skip: !basaId },
  );

  const cycles = useMemo(() => data?.items ?? [], [data]);

  const selected = useMemo(
    () => cycles.find((cycle) => cycle.id === activeCycleId) ?? null,
    [cycles, activeCycleId],
  );

  // Pick a default once the list arrives, or when the stored id is no longer valid.
  useEffect(() => {
    if (!basaId || cycles.length === 0) return;
    if (activeCycleId && cycles.some((cycle) => cycle.id === activeCycleId)) return;

    const fallback = cycles.find((cycle) => cycle.status === "ACTIVE") ?? cycles[0];
    dispatch(setActiveCycle(fallback.id));
  }, [basaId, cycles, activeCycleId, dispatch]);

  return {
    cycleId: selected?.id ?? null,
    cycle: selected,
    cycles,
    /** Writes are rejected by the server once a cycle is closed — hide them. */
    isClosed: selected?.status === "CLOSED",
    isLoading,
    isFetching,
    error,
    hasNoCycle: isSuccess && cycles.length === 0,
    selectCycle: (id: CycleId | null) => dispatch(setActiveCycle(id)),
  };
}
