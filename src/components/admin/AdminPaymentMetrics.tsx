import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminPayments } from "@/hooks/useAdminPayments";
import { formatCurrency } from "@/lib/payments";
import { Wallet, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export function AdminPaymentMetrics() {
  const { metrics, loading } = useAdminPayments();
  const cards = [
    { label: "Pending Payments", value: loading ? "—" : metrics.pending, icon: Clock, link: "/admin/payments?status=pending" },
    { label: "Approved This Month", value: loading ? "—" : formatCurrency(metrics.approved_this_month), icon: CheckCircle2, link: "/admin/payments?status=approved" },
    { label: "Total Revenue Approved", value: loading ? "—" : formatCurrency(metrics.total_revenue_approved), icon: Wallet, link: "/admin/payments?status=approved" },
    { label: "Needs Review", value: loading ? "—" : metrics.needs_review, icon: AlertCircle, link: "/admin/payments?status=needs_review" },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Link key={c.label} to={c.link}>
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}