"use client";

import { Lock, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { CardGridSkeleton, TableSkeleton } from "@/components/common/LoadingSkeleton";
import { CycleBanner } from "@/features/dashboard/components/CycleBanner";
import { SettlementSummary } from "./SettlementSummary";
import { SettlementTable } from "./SettlementTable";
import { SettlementActions } from "./SettlementActions";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { usePermissions } from "@/hooks/usePermissions";
import { useGetSettlementQuery } from "@/store/api/endpoints/settlementApi";
import { normalizeApiError } from "@/lib/api/errors";
import type { BasaId, CycleId } from "@/types/api";

export function SettlementView() {
  const { basaId } = useActiveBasa();
  const { cycleId, cycle, isLoading: cycleLoading } = useActiveCycle();
  const { canFinalizeSettlement } = usePermissions();

  const { data, isLoading, error } = useGetSettlementQuery(
    { basaId: basaId as BasaId, cycleId: cycleId as CycleId },
    { skip: !basaId || !cycleId },
  );

  // "No settlement yet" is a normal state, not a failure — the API signals it with a
  // 404 that we translate into the empty state below.
  const notGeneratedYet = error ? normalizeApiError(error).status === 404 : false;

  if (error && !notGeneratedYet) {
    return <ErrorState error={error} title="Couldn't load the settlement" />;
  }

  return (
    <>
      <PageHeader
        title="Settlement"
        description="Who gets a refund and who still owes, for this billing cycle."
      />

      <CycleBanner />

      <SettlementActions settlement={data ?? null} />

      {cycleLoading || isLoading ? (
        <>
          <CardGridSkeleton count={3} />
          <TableSkeleton columns={7} />
        </>
      ) : !data ? (
        <EmptyState
          icon={Scale}
          title="No settlement generated yet"
          description={
            cycle?.status === "CLOSED"
              ? canFinalizeSettlement
                ? "The cycle is closed. Generate the settlement to work out each roommate's balance."
                : "The cycle is closed. A manager needs to generate the settlement."
              : canFinalizeSettlement
                ? "Close the cycle first — a settlement can only be generated once the numbers are locked."
                : "A manager will close the cycle and generate the settlement at the end of the month."
          }
        />
      ) : (
        <>
          {data.status === "RECALCULATING" ? (
            <Card className="border-[var(--warning)]/40 bg-[var(--warning)]/10">
              <CardContent className="pt-5 text-sm">
                This cycle was reopened, so these figures are out of date. Regenerate the settlement
                once the corrections are in.
              </CardContent>
            </Card>
          ) : null}

          {data.status === "FINALIZED" ? (
            <Card className="border-[var(--success)]/40 bg-[var(--success)]/10">
              <CardContent className="flex items-center gap-2 pt-5 text-sm">
                <Lock className="size-4 shrink-0" aria-hidden />
                This settlement is finalized. The figures are locked.
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div className="space-y-4 lg:order-2">
              <SettlementSummary settlement={data} />
            </div>
            <div className="space-y-4 lg:order-1">
              <SettlementTable settlement={data} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
