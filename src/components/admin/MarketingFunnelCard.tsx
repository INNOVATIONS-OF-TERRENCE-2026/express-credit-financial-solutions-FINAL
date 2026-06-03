import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, RefreshCw } from 'lucide-react';

type Row = { cta_id: string; clicks: number; signups: number; logins: number };

const TRACKED_CTAS: { id: string; label: string }[] = [
  { id: 'start_my_auto_file', label: 'Start My Auto File' },
  { id: 'tiara_website', label: 'Tiara Website' },
  { id: 'tiara_zillow', label: 'Tiara Zillow' },
];

const RANGE_OPTIONS = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 24 * 7 },
  { label: '30d', hours: 24 * 30 },
];

export function MarketingFunnelCard() {
  const [hours, setHours] = useState(24 * 7);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from('marketing_cta_events')
        .select('event, cta_id')
        .gte('created_at', since)
        .limit(10000);
      if (error) throw error;
      const agg: Record<string, Row> = {};
      for (const c of TRACKED_CTAS) agg[c.id] = { cta_id: c.id, clicks: 0, signups: 0, logins: 0 };
      for (const r of data ?? []) {
        if (!agg[r.cta_id]) agg[r.cta_id] = { cta_id: r.cta_id, clicks: 0, signups: 0, logins: 0 };
        if (r.event === 'cta_click') agg[r.cta_id].clicks++;
        else if (r.event === 'signup_completed') agg[r.cta_id].signups++;
        else if (r.event === 'login_completed') agg[r.cta_id].logins++;
      }
      setRows(TRACKED_CTAS.map(c => agg[c.id]));
    } catch (e) {
      console.warn('funnel load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [hours]);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Landing CTA Funnel
          </CardTitle>
          <CardDescription>Clicks and completed signups for marketing CTAs.</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          {RANGE_OPTIONS.map(r => (
            <Button key={r.label} size="sm" variant={hours === r.hours ? 'default' : 'outline'} onClick={() => setHours(r.hours)} className="h-7 px-2 text-xs">
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={load} className="h-7 px-2"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                <th className="py-2 pr-3">CTA</th>
                <th className="py-2 px-3 text-right">Clicks</th>
                <th className="py-2 px-3 text-right">Signups</th>
                <th className="py-2 px-3 text-right">Logins</th>
                <th className="py-2 pl-3 text-right">Conv %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const label = TRACKED_CTAS.find(c => c.id === r.cta_id)?.label ?? r.cta_id;
                const conv = r.clicks > 0 ? ((r.signups + r.logins) / r.clicks) * 100 : 0;
                return (
                  <tr key={r.cta_id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{label}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{r.clicks}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{r.signups}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{r.logins}</td>
                    <td className="py-2 pl-3 text-right tabular-nums">{conv.toFixed(1)}%</td>
                  </tr>
                );
              })}
              {rows.length === 0 && !loading && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">No events yet in this window.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default MarketingFunnelCard;