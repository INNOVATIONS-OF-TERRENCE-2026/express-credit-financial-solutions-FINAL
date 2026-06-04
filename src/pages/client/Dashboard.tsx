import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { useClientPortalData } from '@/hooks/useClientPortalData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, XCircle, ScrollText, FileText, Wallet, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmtMoney = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function DashboardInner() {
  const { clientId, userId, fullName } = useClient();
  const d = useClientPortalData(clientId, userId);

  if (d.loading) return <p className="text-sm text-muted-foreground">Loading your credit progress…</p>;

  const noData = d.startingScore == null && d.currentScore == null && d.accountsDeleted === 0 && d.debtRemoved === 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-amber-500/10 via-background to-blue-500/10 p-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {fullName || 'Client'}</h2>
        <p className="text-muted-foreground mt-1">Your credit progress is being actively managed.</p>
        {d.nextStep && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
            <ArrowRight className="h-4 w-4 text-amber-500" />
            <span><span className="text-muted-foreground">Next step:</span> {d.nextStep}</span>
          </div>
        )}
      </div>

      {/* Score snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardDescription>Starting Score</CardDescription><CardTitle className="text-3xl">{d.startingScore ?? '—'}</CardTitle></CardHeader></Card>
        <Card className="border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardHeader className="pb-2"><CardDescription>Current Score</CardDescription><CardTitle className="text-3xl text-amber-500">{d.currentScore ?? '—'}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Score Change</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {d.scoreChange == null ? '—' : (
                <>
                  {d.scoreChange >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-rose-500" />}
                  <span className={d.scoreChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    {d.scoreChange > 0 ? '+' : ''}{d.scoreChange}
                  </span>
                </>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Transformation tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Accounts Deleted" value={d.accountsDeleted} icon={XCircle} tone="text-emerald-500" />
        <Tile label="Debt Removed" value={fmtMoney(d.debtRemoved)} icon={TrendingDown} tone="text-emerald-400" />
        <Tile label="Inquiries Removed" value={d.inquiriesRemoved} icon={XCircle} tone="text-cyan-500" />
        <Tile label="Personal Info Removed" value={d.personalInfoRemoved} icon={XCircle} tone="text-blue-500" />
      </div>

      {/* Section grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Dispute Progress</CardTitle>
            <CardDescription>Round {d.currentDisputeRound || 0} · {d.remainingNegatives} remaining negatives</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(100, (d.currentDisputeRound || 0) * 25)} />
            <div className="mt-3 text-xs text-muted-foreground">{d.disputesCount} dispute cases on file</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" />Payments</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p>Paid: <strong>{fmtMoney(Number(d.paymentSummary?.total_paid || 0))}</strong></p>
            <p>Pending: <strong>{fmtMoney(Number(d.paymentSummary?.total_pending || 0))}</strong></p>
            <Link to="/client/payments" className="inline-flex items-center mt-2 text-xs text-amber-500 hover:underline">Manage payments <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </CardContent>
        </Card>

        <SmallCard title="Documents Needed" value={d.documentsPendingCount} icon={FileText} to="/client/documents" />
        <SmallCard title="Agreements Signed" value={d.agreementsSigned} icon={ScrollText} to="/client/agreements" />
        <SmallCard title="Credit Reports" value={d.reportsCount} icon={FileText} to="/client/reports" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" />Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {d.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet. Updates appear here as your case progresses.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {d.activity.slice(0, 10).map((a) => (
                <li key={a.id} className="py-2">
                  <p className="font-medium text-sm">{a.title || a.event_type}</p>
                  {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {noData && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Your portal is set up. As soon as your specialist uploads reports and runs your first round, results will appear here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Tile({ label, value, icon: Icon, tone }: { label: string; value: any; icon: any; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <Icon className={`h-4 w-4 ${tone}`} />
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function SmallCard({ title, value, icon: Icon, to }: { title: string; value: any; icon: any; to: string }) {
  return (
    <Link to={to}>
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ClientDashboardPage() {
  return (
    <ClientPortalLayout title="Dashboard">
      <DashboardInner />
    </ClientPortalLayout>
  );
}