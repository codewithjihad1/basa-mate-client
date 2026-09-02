"use client";

import { useState } from "react";
import { Lock, RotateCcw, Scale } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { usePermissions } from "@/hooks/usePermissions";
import { useCloseCycleMutation, useReopenCycleMutation } from "@/store/api/endpoints/cycleApi";
import {
  useFinalizeSettlementMutation,
  useGenerateSettlementMutation,
} from "@/store/api/endpoints/settlementApi";
import { getErrorMessage } from "@/lib/api/errors";
import type { BasaId, CycleId, Settlement } from "@/types/api";

/**
 * Manager actions on a settlement (frontend-requirements §15).
 *
 * The order the server enforces is: close the cycle → generate → finalize. Each
 * button is only offered at the step it is actually valid for, and every one of them
 * goes through a confirmation because they all move money-affecting state.
 */
export function SettlementActions({ settlement }: { settlement: Settlement | null }) {
  const { basaId } = useActiveBasa();
  const { cycleId, cycle } = useActiveCycle();
  const { canFinalizeSettlement } = usePermissions();

  const [confirming, setConfirming] = useState<"close" | "generate" | "finalize" | "reopen" | null>(
    null,
  );
  const [reopenReason, setReopenReason] = useState("");

  const [closeCycle] = useCloseCycleMutation();
  const [reopenCycle] = useReopenCycleMutation();
  const [generateSettlement] = useGenerateSettlementMutation();
  const [finalizeSettlement] = useFinalizeSettlementMutation();

  if (!canFinalizeSettlement || !cycle) return null;

  const scope = { basaId: basaId as BasaId, cycleId: cycleId as CycleId };

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  const isClosed = cycle.status === "CLOSED";
  const isFinalized = settlement?.status === "FINALIZED";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {!isClosed ? (
          <Button onClick={() => setConfirming("close")}>
            <Lock aria-hidden />
            Close cycle
          </Button>
        ) : null}

        {/* Generating requires a closed cycle, and re-running replaces the previous
            settlement — which the server refuses once it is finalized. */}
        {isClosed && !isFinalized ? (
          <Button onClick={() => setConfirming("generate")}>
            <Scale aria-hidden />
            {settlement ? "Regenerate settlement" : "Generate settlement"}
          </Button>
        ) : null}

        {isClosed && settlement && !isFinalized ? (
          <Button variant="outline" onClick={() => setConfirming("finalize")}>
            <Lock aria-hidden />
            Finalize settlement
          </Button>
        ) : null}

        {isClosed ? (
          <Button variant="outline" onClick={() => setConfirming("reopen")}>
            <RotateCcw aria-hidden />
            Reopen cycle
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming === "close"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Close this billing cycle?"
        description="Meals, expenses and deposits become read-only. You can reopen it later if something was missed."
        confirmLabel="Close cycle"
        onConfirm={() => run(() => closeCycle(scope).unwrap(), "Cycle closed")}
      />

      <ConfirmDialog
        open={confirming === "generate"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={settlement ? "Regenerate the settlement?" : "Generate the settlement?"}
        description={
          settlement
            ? "This recalculates from the current meals, expenses and deposits and replaces the existing settlement and all its items."
            : "This calculates each roommate's food cost, shared cost and final balance from the cycle's records."
        }
        confirmLabel={settlement ? "Regenerate" : "Generate"}
        onConfirm={() => run(() => generateSettlement(scope).unwrap(), "Settlement generated")}
      />

      <ConfirmDialog
        open={confirming === "finalize"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Finalize this settlement?"
        description="Once finalized the numbers are locked and cannot be regenerated. Reopening the cycle is the only way back."
        confirmLabel="Finalize"
        onConfirm={() => run(() => finalizeSettlement(scope).unwrap(), "Settlement finalized")}
      />

      <ConfirmDialog
        open={confirming === "reopen"}
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(null);
            setReopenReason("");
          }
        }}
        title="Reopen this cycle?"
        description={
          <div className="space-y-3">
            <p>
              Meals, expenses and deposits become editable again, and any settlement is marked as
              recalculating.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reopen-reason">Reason</Label>
              <Input
                id="reopen-reason"
                value={reopenReason}
                onChange={(event) => setReopenReason(event.target.value)}
                placeholder="Two meals were missing for September"
                minLength={3}
                maxLength={500}
              />
            </div>
          </div>
        }
        confirmLabel="Reopen cycle"
        destructive
        onConfirm={() =>
          run(() => reopenCycle({ ...scope, reason: reopenReason }).unwrap(), "Cycle reopened")
        }
      />
    </>
  );
}
