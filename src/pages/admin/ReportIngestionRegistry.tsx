import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

type RegistryClient = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  ssn_last4: string | null;
  portal_status: string | null;
  membership_plan: string | null;
  service_status: string | null;
  current_score_ex: number | null;
  current_score_eq: number | null;
  current_score_tu: number | null;
  created_at: string | null;
};

function csvEscape(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: RegistryClient[]) {
  const headers = [
    'client_id', 'user_id', 'full_name', 'email', 'phone', 'date_of_birth', 'ssn_last4',
    'portal_status', 'membership_plan', 'service_status', 'experian_score', 'equifax_score', 'transunion_score', 'created_at',
  ];
  const body = rows.map((row) => [
    row.id, row.user_id, row.full_name, row.email, row.phone, row.dob, row.ssn_last4,
    row.portal_status, row.membership_plan, row.service_status,
    row.current_score_ex, row.current_score_eq, row.current_score_tu, row.created_at,
  ].map(csvEscape).join(','));

  const blob = new Blob([[headers.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `express-credit-client-registry-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportIngestionRegistry() {
  const [rows, setRows] = useState<RegistryClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id,user_id,full_name,email,phone,dob,ssn_last4,portal_status,membership_plan,service_status,current_score_ex,current_score_eq,current_score_tu,created_at')
        .eq('not_a_client', false)
        .order('full_name', { ascending: true });
      if (error) throw error;
      setRows((data || []) as RegistryClient[]);
    } catch (error) {
      console.error('Unable to load report ingestion registry:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.full_name, row.email, row.phone, row.ssn_last4, row.id]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)));
  }, [query, rows]);

  const linked = rows.filter((row) => Boolean(row.user_id)).length;

  return (
    <AdminShell title="Report Ingestion Registry" subtitle="Client matching map for batch credit report uploads">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle>Total registry clients</CardTitle><CardDescription>Eligible CRM client records</CardDescription></CardHeader><CardContent className="text-3xl font-black">{loading ? '—' : rows.length}</CardContent></Card>
          <Card><CardHeader><CardTitle>Portal linked</CardTitle><CardDescription>Clients with auth user_id</CardDescription></CardHeader><CardContent className="text-3xl font-black">{loading ? '—' : linked}</CardContent></Card>
          <Card><CardHeader><CardTitle>Not linked</CardTitle><CardDescription>Needs account creation/linking</CardDescription></CardHeader><CardContent className="text-3xl font-black">{loading ? '—' : rows.length - linked}</CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div><CardTitle>Client Matching Registry</CardTitle><CardDescription>Use this list before uploading report batches. Do not process reports for clients who are missing verified identity fields.</CardDescription></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
                <Button onClick={() => downloadCsv(filtered)}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone, SSN last4, or client ID" />
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="p-3">Client</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">DOB</th><th className="p-3">SSN4</th><th className="p-3">Portal</th><th className="p-3">Scores</th><th className="p-3">Client ID</th></tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="p-3 font-medium">{row.full_name || 'Unnamed client'}</td>
                      <td className="p-3">{row.email || <span className="text-destructive">Missing</span>}</td>
                      <td className="p-3">{row.phone || '—'}</td>
                      <td className="p-3">{row.dob || '—'}</td>
                      <td className="p-3">{row.ssn_last4 || '—'}</td>
                      <td className="p-3"><Badge variant={row.user_id ? 'default' : 'destructive'}>{row.user_id ? 'Linked' : 'Not linked'}</Badge></td>
                      <td className="p-3">EX {row.current_score_ex || '—'} · EQ {row.current_score_eq || '—'} · TU {row.current_score_tu || '—'}</td>
                      <td className="p-3 font-mono text-xs">{row.id}</td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No clients match this search.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
