import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Shield, ChevronDown, ChevronRight } from 'lucide-react';

interface Row {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  details: any;
  security_level: string | null;
  risk_score: number | null;
  created_at: string;
}

const ACTION_FILTERS: { value: string; label: string; match: (a: string) => boolean }[] = [
  { value: 'all', label: 'All actions', match: () => true },
  { value: 'membership', label: 'Membership changes', match: a => /membership/i.test(a) },
  { value: 'client', label: 'Client edits', match: a => /client/i.test(a) && !/membership/i.test(a) },
  { value: 'dispute', label: 'Dispute status', match: a => /dispute/i.test(a) },
  { value: 'upload', label: 'File uploads', match: a => /upload|file/i.test(a) },
  { value: 'agreement', label: 'Agreements', match: a => /agreement|sign/i.test(a) },
  { value: 'security', label: 'Security events', match: a => /login|role|token|password|access/i.test(a) },
];

function levelBadge(level: string | null, risk: number | null) {
  const r = risk ?? 0;
  if (r >= 7 || level === 'critical') return <Badge variant="destructive">High</Badge>;
  if (r >= 3 || level === 'warning') return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Med</Badge>;
  return <Badge variant="outline">Low</Badge>;
}

export function AdminAuditLogPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('id,user_id,action,table_name,record_id,details,security_level,risk_score,created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    const channel = supabase.channel('audit-logs-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => fetchRows())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filter = useMemo(() => ACTION_FILTERS.find(f => f.value === actionFilter) || ACTION_FILTERS[0], [actionFilter]);

  const filtered = rows.filter(r => {
    if (!filter.match(r.action || '')) return false;
    if (search) {
      const q = search.toLowerCase();
      const blob = `${r.action} ${r.table_name} ${r.record_id || ''} ${JSON.stringify(r.details || {})}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Audit Log</CardTitle>
          <Button size="sm" variant="outline" onClick={fetchRows} className="h-9">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Search action, record, details…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTION_FILTERS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No audit entries match these filters.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map(r => {
              const isOpen = expanded.has(r.id);
              return (
                <li key={r.id} className="py-3">
                  <button onClick={() => toggle(r.id)} className="w-full text-left flex items-start gap-3 hover:bg-accent/5 rounded-lg p-2 -m-2 transition-colors">
                    <div className="mt-1">{isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{r.action}</span>
                        <Badge variant="outline" className="text-[10px]">{r.table_name}</Badge>
                        {levelBadge(r.security_level, r.risk_score)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleString()}
                        {r.record_id ? ` · record ${r.record_id.slice(0, 8)}…` : ''}
                        {r.user_id ? ` · by ${r.user_id.slice(0, 8)}…` : ''}
                      </p>
                    </div>
                  </button>
                  {isOpen && r.details && (
                    <pre className="mt-2 ml-7 max-h-64 overflow-auto text-[11px] bg-muted/50 rounded-md p-3 text-foreground whitespace-pre-wrap break-words">
{JSON.stringify(r.details, null, 2)}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}