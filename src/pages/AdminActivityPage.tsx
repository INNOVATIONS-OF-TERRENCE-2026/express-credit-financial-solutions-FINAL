import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function AdminActivityPage() {
  const [audit, setAudit] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const client: any = supabase;
      const [a, b] = await Promise.all([
        client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
        client.from('client_activity_timeline').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      setAudit(a.data || []);
      setActivity(b.data || []);
    })();
  }, []);

  return (
    <AdminShell title="Activity & Audit Logs" subtitle="System events and client timeline">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Audit Logs ({audit.length})</CardTitle></CardHeader>
          <CardContent className="max-h-[70vh] overflow-y-auto text-sm">
            <ul className="divide-y divide-border/40">
              {audit.map((r) => (
                <li key={r.id} className="py-2">
                  <div className="flex justify-between gap-3">
                    <span><span className="font-medium">{r.action}</span> <span className="text-muted-foreground">· {r.table_name}</span></span>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Client Timeline ({activity.length})</CardTitle></CardHeader>
          <CardContent className="max-h-[70vh] overflow-y-auto text-sm">
            <ul className="divide-y divide-border/40">
              {activity.map((r) => (
                <li key={r.id} className="py-2">
                  <p className="font-medium">{r.title || r.event_type}</p>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}