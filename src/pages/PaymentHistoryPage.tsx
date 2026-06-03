import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePayments } from "@/hooks/usePayments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentHistoryList } from "@/components/payments/PaymentHistoryList";
import { formatCurrency } from "@/lib/payments";
import { ArrowLeft, CreditCard } from "lucide-react";

export default function PaymentHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { records, summary, loading, replaceProof } = usePayments();
  if (!authLoading && !user) { navigate("/", { replace: true }); return null; }
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to portal
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          </div>
          <Button asChild><Link to="/payments"><CreditCard className="h-4 w-4 mr-2" />Make a Payment</Link></Button>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Total Paid</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(summary?.total_paid ?? 0)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Pending</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(summary?.total_pending ?? 0)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Last Payment</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{summary?.last_payment_amount ? formatCurrency(summary.last_payment_amount) : "—"}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Total Records</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{records.length}</p></CardContent></Card>
        </div>
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading…</div>
        ) : (
          <PaymentHistoryList records={records} onReplace={replaceProof} />
        )}
      </div>
    </div>
  );
}