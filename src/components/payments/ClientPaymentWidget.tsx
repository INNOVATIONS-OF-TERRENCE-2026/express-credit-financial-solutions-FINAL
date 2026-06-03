import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, CreditCard } from "lucide-react";
import { usePayments } from "@/hooks/usePayments";
import { formatCurrency, methodLabel } from "@/lib/payments";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

export function ClientPaymentWidget() {
  const { summary, loading } = usePayments();
  const banner = (() => {
    if (!summary?.last_payment_status) return null;
    if (summary.last_payment_status === "pending") return "Your latest payment proof is pending review.";
    if (summary.last_payment_status === "approved") return "Your latest payment was approved.";
    if (summary.last_payment_status === "rejected") return "Payment proof needs attention. Please upload a clearer screenshot.";
    if (summary.last_payment_status === "needs_review") return "Payment needs your attention. Please upload a clearer screenshot.";
    return null;
  })();
  return (
    <Card className="glass-card-hover">
      <CardHeader>
        <CardTitle className="flex items-center"><Wallet className="h-5 w-5 text-primary mr-2" />Payment Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-foreground">{loading ? "—" : formatCurrency(summary?.total_paid ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-foreground">{loading ? "—" : formatCurrency(summary?.total_pending ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Last Payment</p>
            <p className="text-sm text-foreground">
              {summary?.last_payment_amount
                ? `${formatCurrency(summary.last_payment_amount)} • ${methodLabel(summary.last_payment_method)}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
            {summary?.last_payment_status ? <PaymentStatusBadge status={summary.last_payment_status} /> : <span className="text-sm text-muted-foreground">—</span>}
          </div>
        </div>
        {banner && <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{banner}</div>}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild className="flex-1"><Link to="/payments"><CreditCard className="h-4 w-4 mr-2" />Make a Payment</Link></Button>
          <Button asChild variant="outline" className="flex-1"><Link to="/payment-history">View Payment History</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}