import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { VerificationStatus } from "@/lib/types";
import { classNames } from "@/lib/utils";

const labelByStatus: Record<VerificationStatus, string> = {
  not_submitted: "Not submitted",
  pending: "Pending review",
  verified: "Verified by HoopTrust",
  needs_correction: "Needs correction",
  rejected: "Rejected"
};

export function StatBadge({ status }: { status: VerificationStatus }) {
  const isVerified = status === "verified";
  const isPending = status === "pending" || status === "needs_correction" || status === "not_submitted";
  const Icon = isVerified ? CheckCircle2 : isPending ? Clock : XCircle;

  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        isVerified && "bg-emerald-50 text-emerald-700",
        isPending && "bg-amber-50 text-amber-700",
        status === "rejected" && "bg-red-50 text-red-700"
      )}
    >
      <Icon size={14} />
      {labelByStatus[status]}
    </span>
  );
}
