import { CheckCircle2, Clock, CircleAlert, Lock, RotateCcw, ArrowDownLeft, ArrowUpRight, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  CycleStatus,
  InvitationStatus,
  JoinRequestStatus,
  SettlementItemStatus,
  SettlementStatus,
} from "@/types/api";

/**
 * Status pills for every domain status.
 *
 * Each pairs its colour with an icon and a word, so colour is never the only
 * indicator of state (frontend-requirements §30).
 */

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

interface Descriptor {
  label: string;
  variant: BadgeVariant;
  Icon: React.ComponentType<{ className?: string }>;
}

const SETTLEMENT_ITEM: Record<SettlementItemStatus, Descriptor> = {
  REFUND: { label: "Refund", variant: "success", Icon: ArrowDownLeft },
  PAYMENT_DUE: { label: "Due", variant: "destructive", Icon: ArrowUpRight },
  SETTLED: { label: "Settled", variant: "secondary", Icon: CheckCircle2 },
};

const CYCLE: Record<CycleStatus, Descriptor> = {
  ACTIVE: { label: "Active", variant: "success", Icon: CheckCircle2 },
  CLOSED: { label: "Closed", variant: "secondary", Icon: Lock },
  REOPENED: { label: "Reopened", variant: "warning", Icon: RotateCcw },
};

const SETTLEMENT: Record<SettlementStatus, Descriptor> = {
  GENERATED: { label: "Generated", variant: "default", Icon: Clock },
  FINALIZED: { label: "Finalized", variant: "success", Icon: Lock },
  RECALCULATING: { label: "Recalculating", variant: "warning", Icon: RotateCcw },
};

const INVITATION: Record<InvitationStatus, Descriptor> = {
  PENDING: { label: "Pending", variant: "warning", Icon: Clock },
  ACCEPTED: { label: "Accepted", variant: "success", Icon: CheckCircle2 },
  EXPIRED: { label: "Expired", variant: "secondary", Icon: CircleAlert },
};

const JOIN_REQUEST: Record<JoinRequestStatus, Descriptor> = {
  PENDING: { label: "Pending", variant: "warning", Icon: Clock },
  ACCEPTED: { label: "Accepted", variant: "success", Icon: CheckCircle2 },
  REJECTED: { label: "Rejected", variant: "destructive", Icon: XCircle },
  CANCELLED: { label: "Cancelled", variant: "secondary", Icon: CircleAlert },
};

function render(descriptor: Descriptor | undefined, fallback: string) {
  if (!descriptor) return <Badge variant="secondary">{fallback}</Badge>;
  const { label, variant, Icon } = descriptor;
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}

export const SettlementItemBadge = ({ status }: { status: SettlementItemStatus }) =>
  render(SETTLEMENT_ITEM[status], status);

export const CycleStatusBadge = ({ status }: { status: CycleStatus }) => render(CYCLE[status], status);

export const SettlementStatusBadge = ({ status }: { status: SettlementStatus }) =>
  render(SETTLEMENT[status], status);

export const InvitationStatusBadge = ({ status }: { status: InvitationStatus }) =>
  render(INVITATION[status], status);

export const JoinRequestStatusBadge = ({ status }: { status: JoinRequestStatus }) =>
  render(JOIN_REQUEST[status], status);
