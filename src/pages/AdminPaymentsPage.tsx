import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useAdminPayments, AdminPaymentRow } from "@/hooks/useAdminPayments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPaymentsTable } from "@/components/admin/AdminPaymentsTable";
import { AdminPaymentReviewModal } from "@/components/admin/AdminPaymentReviewModal";
import { formatCurrency } from "@/lib/payments";
import { ArrowLeft, RefreshCcw, Search } from "lucide-react";

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRoles();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const actions = useAdminPayments();
  const [selected, setSelected] = useState<AdminPaymentRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(params.get("status") ?? "all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !roleLoading && (!user || !isAdmin())) {
      navigate("/", { replace: true });
    }
  }, [authLoading, roleLoading, user, isAdmin, navigate]);

  useEffect(() => {
    const p = new URLSearchParams(params);
    if (statusFilter === "all") p.delete("status"); else p.set("status", statusFilter);
    setParams(p, { replace: true });
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return actions.rows.filter((r) => {
      if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
      if (methodFilter !== "all" && r.payment_method !== methodFilter) return false;
      if (!q) return true;
      return [
        r.profile_email,
        r.profile_first_name,
        r.profile_last_name,
        String(r.payment_amount),
        r.payment_method,
      ].some((v) => v?.toString().toLowerCase().includes(q));
    });
  }, [actions.rows, statusFilter, methodFilter, search]);

  const m = actions.metrics;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to admin dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Payment Center</h1>
            <p className="text-muted-foreground mt-1">Review, approve, and manage manual Cash App and Apple Pay payments.</p>
          </div>
          <Button variant="outline" onClick={() => actions.refresh()} disabled={actions.loading}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: m.total },
            { label: "Pending", value: m.pending },
            { label: "Approved", value: m.approved },
            { label: "Needs Review", value: m.needs_review },
            { label: "Revenue Approved", value: formatCurrency(m.total_revenue_approved) },
            { label: "Pending Amount", value: formatCurrency(m.total_pending_amount) },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{s.value}</p></CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <CardTitle>All Payments</CardTitle>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8 w-56" placeholder="Client, email, amount…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="cash_app">Cash App</SelectItem>
                  <SelectItem value="apple_pay">Apple Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {actions.loading ? (
              <div className="text-center text-muted-foreground py-12">Loading payments…</div>
            ) : (
              <AdminPaymentsTable rows={filtered} onOpen={setSelected} />
            )}
          </CardContent>
        </Card>

        <AdminPaymentReviewModal payment={selected} onClose={() => setSelected(null)} actions={actions} />
      </div>
    </div>
  );
}