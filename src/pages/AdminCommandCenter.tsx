import { AdminShell } from '@/components/admin/AdminShell';
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid';
import { AdminActionQueue, AdminClientPipeline, AdminQuickActionCard } from '@/components/admin/AdminCommandCenterWidgets';
import { ADMIN_QUICK_ACTIONS } from '@/components/admin/adminCommandCenterActions';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Upload, UserPlus, Gavel, Activity, Home } from 'lucide-react';
import { MarketingFunnelCard } from '@/components/admin/MarketingFunnelCard';
import { AdminPaymentMetrics } from '@/components/admin/AdminPaymentMetrics';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LuxuryCard, LuxurySection, EyebrowLabel } from '@/components/luxury';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';

type AuditRow = {
  id: string;
  action: string;
  table_name: string | null;
  created_at: string;
  details: unknown;
};

function RecentActivityFeed() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, created_at, details')
        .order('created_at', { ascending: false })
        .limit(15);
      setRows((data || []) as AuditRow[]);
    })();
  }, []);
  return (
    <LuxuryCard className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <EyebrowLabel withRule>Audit Ledger</EyebrowLabel>
          <h3 className="lux-display text-xl md:text-2xl mt-2 text-foreground">Recent Activity</h3>
        </div>
        <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Link to="/admin/activity"><Activity className="h-4 w-4 mr-1" />View all</Link>
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((r) => (
            <li key={r.id} className="py-3 text-sm flex justify-between gap-4">
              <span className="truncate">
                <span className="font-medium text-foreground">{r.action}</span>
                <span className="text-muted-foreground"> · {r.table_name}</span>
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </LuxuryCard>
  );
}

export default function AdminCommandCenter() {
  const metrics = useAdminMetrics();

  return (
    <AdminShell
      title="Command Center"
      subtitle="Office of Credit Restoration"
      actions={
        <div className="hidden md:flex gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-full border-border/80">
            <Link to="/admin/clients"><UserPlus className="h-4 w-4 mr-1.5" />Add Client</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full bg-midnight hover:bg-midnight/90 text-ivory">
            <Link to="/admin/upload-reports"><Upload className="h-4 w-4 mr-1.5" />Upload Report</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-12 md:space-y-16">
        {/* Welcome panel */}
        <LuxuryCard variant="midnight" elevated accent className="p-8 md:p-10 lg:p-12">
          <div className="grid lg:grid-cols-3 gap-8 items-end">
            <div className="lg:col-span-2 space-y-3">
              <EyebrowLabel withRule>Express Credit · Private Office</EyebrowLabel>
              <h2 className="lux-display text-3xl md:text-5xl text-ivory leading-[1.05]">
                Every client. Every dispute. Every dollar — in one quiet view.
              </h2>
              <p className="text-sm md:text-base text-ivory/70 max-w-2xl leading-relaxed">
                Operate the restoration program with the precision of a private bank. Numbers stay tabular,
                actions stay decisive, the room stays calm.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button asChild size="sm" variant="outline" className="rounded-full border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory">
                <Link to="/admin/disputes?status=review"><Gavel className="h-4 w-4 mr-1.5" />Work Queue</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-gradient-gold text-midnight hover:opacity-95">
                <Link to="/admin/upload-reports"><Upload className="h-4 w-4 mr-1.5" />Process Report</Link>
              </Button>
            </div>
          </div>
        </LuxuryCard>

        {/* KPI grid */}
        <LuxurySection eyebrow="Today" title="Operational Snapshot" divider={false}>
          <AdminKpiGrid metrics={metrics} />
        </LuxurySection>

        <LuxurySection eyebrow="Action" title="Priority Work" description="A clear queue for today's decisions across payments, agreements, documents, reports, and disputes." divider={false}>
          <AdminActionQueue metrics={metrics} />
        </LuxurySection>

        {/* Wide payment + funnel row */}
        <LuxurySection eyebrow="Revenue & Funnel" title="Financial Health" divider={false}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <AdminPaymentMetrics />
              <AdminClientPipeline metrics={metrics} />
              <LuxuryCard className="p-6 md:p-8">
                <EyebrowLabel withRule>Quick Actions</EyebrowLabel>
                <h3 className="lux-display text-xl md:text-2xl mt-2 mb-5 text-foreground">Move the program forward</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {ADMIN_QUICK_ACTIONS.map((action) => (
                    <AdminQuickActionCard key={action.to + action.label} {...action} />
                  ))}
                </div>
              </LuxuryCard>
            </div>
            <div className="space-y-6">
              <MarketingFunnelCard />
              <LuxuryCard variant="champagne" className="p-6">
                <EyebrowLabel>Concierge</EyebrowLabel>
                <h4 className="lux-display text-lg mt-2 text-foreground">Funding Readiness</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Track clients approaching mortgage and auto financing thresholds.
                </p>
                <Button asChild size="sm" variant="ghost" className="mt-3 px-0 text-gold-deep hover:text-gold-deep hover:bg-transparent">
                  <Link to="/admin/clients?focus=readiness"><Home className="h-3.5 w-3.5 mr-1.5" />Open readiness view</Link>
                </Button>
              </LuxuryCard>
            </div>
          </div>
        </LuxurySection>

        {/* Activity ledger */}
        <LuxurySection eyebrow="System" title="Activity Ledger" description="Latest events across every client, dispute, and payment." divider={false}>
          <RecentActivityFeed />
        </LuxurySection>
      </div>
    </AdminShell>
  );
}
