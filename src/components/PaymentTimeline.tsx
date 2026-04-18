import { Check, Clock, Eye, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type TimelinePayment = {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  amount_pkr: number;
  kind: "subscription" | "credit_pack";
  trial_credits_granted_at: string | null;
  trial_credits_amount: number;
  trial_credits_reverted: boolean;
  admin_notes: string | null;
  pack_name?: string | null;
  plan_name?: string | null;
};

const fmt = (iso: string | null) => (iso ? format(new Date(iso), "MMM d, h:mm a") : "—");

export function PaymentTimeline({ payment }: { payment: TimelinePayment }) {
  const isApproved = payment.status === "approved";
  const isRejected = payment.status === "rejected";
  const reviewing = payment.status === "pending";
  const title = payment.pack_name || payment.plan_name || "Payment";

  const steps = [
    {
      label: "Submitted",
      time: fmt(payment.created_at),
      done: true,
      icon: Check,
    },
    {
      label: "Under review",
      time: reviewing ? "In progress…" : fmt(payment.created_at),
      done: !reviewing,
      active: reviewing,
      icon: reviewing ? Eye : Check,
    },
    {
      label: isRejected ? "Rejected" : "Approved",
      time: isApproved || isRejected ? fmt(payment.reviewed_at) : "Usually within 24h",
      done: isApproved || isRejected,
      icon: isRejected ? X : Check,
      isRejected,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {title}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              · Rs.{payment.amount_pkr.toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {payment.kind === "subscription" ? "Monthly subscription" : "One-time credit pack"}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            isApproved && "bg-primary/15 text-primary",
            isRejected && "bg-destructive/15 text-destructive",
            reviewing && "bg-muted text-muted-foreground",
          )}
        >
          {reviewing && <Clock className="h-3 w-3" />}
          {isApproved && <Check className="h-3 w-3" />}
          {isRejected && <X className="h-3 w-3" />}
          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
        </span>
      </div>

      {payment.trial_credits_granted_at && payment.trial_credits_amount > 0 && (
        <div
          className={cn(
            "mb-3 flex items-start gap-2 rounded-lg border p-2.5 text-xs",
            payment.trial_credits_reverted
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-primary/30 bg-primary/5 text-primary",
          )}
        >
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {payment.trial_credits_reverted
              ? `${payment.trial_credits_amount} trial credits were reverted after rejection.`
              : `${payment.trial_credits_amount} trial credits granted instantly so you can keep building.`}
          </span>
        </div>
      )}

      <ol className="relative space-y-4 border-l border-border pl-6">
        {steps.map((s, i) => (
          <li key={i} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border-2",
                s.done && !s.isRejected && "border-primary bg-primary text-primary-foreground",
                s.done && s.isRejected && "border-destructive bg-destructive text-destructive-foreground",
                !s.done && (s as any).active && "border-primary bg-background text-primary animate-pulse",
                !s.done && !(s as any).active && "border-border bg-background text-muted-foreground",
              )}
            >
              <s.icon className="h-3 w-3" />
            </span>
            <p
              className={cn(
                "text-sm font-medium",
                s.done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </p>
            <p className="text-xs text-muted-foreground">{s.time}</p>
          </li>
        ))}
      </ol>

      {isRejected && payment.admin_notes && (
        <p className="mt-3 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
          <span className="font-medium">Reason: </span>
          {payment.admin_notes}
        </p>
      )}
    </div>
  );
}
