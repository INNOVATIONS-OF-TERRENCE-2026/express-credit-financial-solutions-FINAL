import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PaymentStatus, statusLabel } from "@/lib/payments";

const styles: Record<PaymentStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  approved: "bg-green-500/15 text-green-400 border border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border border-red-500/30",
  needs_review: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
};

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus | string;
  className?: string;
}) {
  const s = (status as PaymentStatus) || "pending";
  return (
    <Badge variant="outline" className={cn(styles[s] ?? "", "font-medium", className)}>
      {statusLabel(s)}
    </Badge>
  );
}