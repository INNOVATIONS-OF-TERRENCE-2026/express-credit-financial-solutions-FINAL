import { AdminShell } from '@/components/admin/AdminShell';
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Upload, UserPlus, Gavel, Mail, Activity } from 'lucide-react';
import { MarketingFunnelCard } from '@/components/admin/MarketingFunnelCard';
import { AdminPaymentMetrics } from '@/components/admin/AdminPaymentMetrics';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function RecentActivityFeed() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const client: any = supabase;
      const { data } = await client
        .from('audit_logs')
        .select('id, action, table_name, created_at, details')
        .order('created_at', { ascending: false })
        .limit(15);
      setRows(data || []);
    })();
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" /> Recent Activity
        </CardTitle>
        <CardDescription>Latest system events across all clients</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {rows.map((r) => (
              <li key={r.id} className="py-2 text-sm flex justify-between gap-3">
                <span className="truncate">
                  <span className="font-medium">{r.action}</span>
                  <span className="text-muted-foreground"> · {r.table_name}</span>
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminCommandCenter() {
  return (
    <AdminShell
      title="Admin Command Center"
      subtitle="Live operational view of every client, dispute, and payment"
      actions={
        <div className="hidden md:flex gap-2">
          <Button asChild size="sm" variant="outline"><Link to="/admin/clients"><UserPlus className="h-4 w-4 mr-1" />Add Client</Link></Button>
          <Button asChild size="sm"><Link to="/admin/upload-reports"><Upload className="h-4 w-4 mr-1" />Upload Report</Link></Button>
        </div>
      }
    >
      <div className="space-y-6">
        <AdminKpiGrid />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <AdminPaymentMetrics />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button asChild variant="outline" className="justify-start"><Link to="/admin/upload-reports"><Upload className="h-4 w-4 mr-2" />Upload Report</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/admin/clients"><UserPlus className="h-4 w-4 mr-2" />Add Client</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/admin/disputes?status=review"><Gavel className="h-4 w-4 mr-2" />Review Queue</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/admin/activity"><Mail className="h-4 w-4 mr-2" />Activity</Link></Button>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <MarketingFunnelCard />
          </div>
        </div>

        <RecentActivityFeed />
      </div>
    </AdminShell>
  );
}