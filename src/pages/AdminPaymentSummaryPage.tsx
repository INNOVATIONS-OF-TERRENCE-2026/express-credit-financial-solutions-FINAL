import { useEffect, useMemo, useState, useCallback } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Save, Search } from 'lucide-react';

const STATUSES = ['unpaid', 'pending', 'partial', 'paid', 'refunded', 'waived', 'disputed', 'manual_review'] as const;
type Status = typeof STATUSES[number];

interface Row {
  id: string;
  client_id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  expected_amount: number;
  paid_amount: number;
  payment_status: Status;
  payment_method: string | null;
  payment_date: string | null;
  service_type: string | null;
  receipt_reference: string | null;
  verified_by_admin: boolean;
  visible_to_client: boolean;
  notes: string | null;
  _dirty?: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

export default function AdminPaymentSummaryPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb: any = supabase;
      const { data: clients, error: cErr } = await sb
        .from('clients')
        .select('id, user_id, full_name, email, not_a_client')
        .order('full_name', { ascending: true });
      if (cErr) throw cErr;

      const realClients = (clients || []).filter((c: any) => !c.not_a_client);

      // Ensure a summary row exists for every client (lazy backfill via RPC)
      const { data: existing } = await sb
        .from('client_payment_summary')
        .select('*');
      const byCid = new Map<string, any>((existing || []).map((r: any) => [r.client_id, r]));

      const missing = realClients.filter((c: any) => !byCid.has(c.id));
      if (missing.length > 0) {
        for (const c of missing) {
          try {
            const { data } = await sb.rpc('ensure_payment_summary', { p_client_id: c.id });
            if (data) byCid.set(c.id, data);
          } catch {}
        }
      }

      const merged: Row[] = realClients.map((c: any) => {
        const s = byCid.get(c.id) || {};
        return {
          id: s.id || '',
          client_id: c.id,
          user_id: c.user_id,
          full_name: c.full_name,
          email: c.email,
          expected_amount: Number(s.expected_amount ?? 600),
          paid_amount: Number(s.paid_amount ?? 0),
          payment_status: (s.payment_status as Status) || 'unpaid',
          payment_method: s.payment_method ?? null,
          payment_date: s.payment_date ?? null,
          service_type: s.service_type ?? 'Credit Repair',
          receipt_reference: s.receipt_reference ?? null,
          verified_by_admin: !!s.verified_by_admin,
          visible_to_client: s.visible_to_client !== false,
          notes: s.notes ?? null,
        };
      });
      setRows(merged);
    } catch (e: any) {
      toast({ title: 'Load failed', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const update = (cid: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.client_id === cid ? { ...r, ...patch, _dirty: true } : r)));

  const saveRow = async (r: Row) => {
    setSavingId(r.client_id);
    try {
      const sb: any = supabase;
      const payload = {
        client_id: r.client_id,
        user_id: r.user_id,
        expected_amount: r.expected_amount,
        paid_amount: r.paid_amount,
        payment_status: r.payment_status,
        payment_method: r.payment_method,
        payment_date: r.payment_date,
        service_type: r.service_type,
        receipt_reference: r.receipt_reference,
        verified_by_admin: r.verified_by_admin,
        visible_to_client: r.visible_to_client,
        notes: r.notes,
        updated_at: new Date().toISOString(),
      };
      const { error } = await sb
        .from('client_payment_summary')
        .upsert(payload, { onConflict: 'client_id' });
      if (error) throw error;
      setRows((rs) => rs.map((x) => (x.client_id === r.client_id ? { ...x, _dirty: false } : x)));
      toast({ title: 'Saved', description: r.full_name || r.email || r.client_id });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.full_name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.payment_method || '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const kpis = useMemo(() => {
    const expected = rows.reduce((s, r) => s + Number(r.expected_amount || 0), 0);
    const paid = rows.reduce((s, r) => s + Number(r.paid_amount || 0), 0);
    const balance = expected - paid;
    const count = (s: Status) => rows.filter((r) => r.payment_status === s).length;
    return {
      expected,
      paid,
      balance,
      total: rows.length,
      paidClients: count('paid'),
      unpaid: count('unpaid'),
      partial: count('partial'),
      review: count('manual_review') + count('pending'),
    };
  }, [rows]);

  return (
    <AdminShell title="Payment Center — Client Balances" subtitle="Source of truth: $600 default per client. Editable inline.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { l: 'Total Clients', v: kpis.total },
            { l: 'Total Expected', v: fmt(kpis.expected) },
            { l: 'Total Paid', v: fmt(kpis.paid), tone: 'text-emerald-500' },
            { l: 'Balance Due', v: fmt(kpis.balance), tone: 'text-amber-500' },
            { l: 'Paid', v: kpis.paidClients, tone: 'text-emerald-500' },
            { l: 'Unpaid', v: kpis.unpaid, tone: 'text-rose-500' },
            { l: 'Partial', v: kpis.partial },
            { l: 'Needs Review', v: kpis.review, tone: 'text-amber-500' },
          ].map((k) => (
            <Card key={k.l} className="p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.l}</p>
              <p className={`text-lg font-bold ${(k as any).tone || ''}`}>{k.v}</p>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <CardTitle className="text-base">All Client Balances</CardTitle>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8 w-56" placeholder="Name, email, method…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="w-28">Expected</TableHead>
                  <TableHead className="w-28">Paid</TableHead>
                  <TableHead className="w-28">Balance</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="w-32">Method</TableHead>
                  <TableHead className="w-40">Date</TableHead>
                  <TableHead className="w-40">Service</TableHead>
                  <TableHead className="w-40">Receipt Ref</TableHead>
                  <TableHead className="w-20">Verified</TableHead>
                  <TableHead className="w-20">Visible</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const bal = Number(r.expected_amount || 0) - Number(r.paid_amount || 0);
                  return (
                    <TableRow key={r.client_id} className={r._dirty ? 'bg-amber-500/5' : ''}>
                      <TableCell>
                        <div className="font-medium">{r.full_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{r.email || (r.user_id ? 'no email' : <Badge variant="outline" className="text-[10px]">no portal</Badge>)}</div>
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" value={r.expected_amount} onChange={(e) => update(r.client_id, { expected_amount: Number(e.target.value) })} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" value={r.paid_amount} onChange={(e) => update(r.client_id, { paid_amount: Number(e.target.value) })} className="h-8" />
                      </TableCell>
                      <TableCell className={bal > 0 ? 'text-amber-500 font-medium' : 'text-emerald-500 font-medium'}>{fmt(bal)}</TableCell>
                      <TableCell>
                        <Select value={r.payment_status} onValueChange={(v) => update(r.client_id, { payment_status: v as Status })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input value={r.payment_method || ''} onChange={(e) => update(r.client_id, { payment_method: e.target.value || null })} className="h-8" placeholder="cash_app…" />
                      </TableCell>
                      <TableCell>
                        <Input type="date" value={r.payment_date ? r.payment_date.slice(0, 10) : ''} onChange={(e) => update(r.client_id, { payment_date: e.target.value ? new Date(e.target.value).toISOString() : null })} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={r.service_type || ''} onChange={(e) => update(r.client_id, { service_type: e.target.value || null })} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={r.receipt_reference || ''} onChange={(e) => update(r.client_id, { receipt_reference: e.target.value || null })} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Switch checked={r.verified_by_admin} onCheckedChange={(v) => update(r.client_id, { verified_by_admin: v })} />
                      </TableCell>
                      <TableCell>
                        <Switch checked={r.visible_to_client} onCheckedChange={(v) => update(r.client_id, { visible_to_client: v })} />
                      </TableCell>
                      <TableCell>
                        <Input value={r.notes || ''} onChange={(e) => update(r.client_id, { notes: e.target.value || null })} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" disabled={!r._dirty || savingId === r.client_id} onClick={() => saveRow(r)}>
                          <Save className="h-3 w-3 mr-1" /> Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={13} className="text-center text-sm text-muted-foreground py-6">{loading ? 'Loading…' : 'No clients.'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}