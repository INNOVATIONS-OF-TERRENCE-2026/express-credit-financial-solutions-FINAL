import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, RefreshCw, Search, XCircle } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

type ReviewRow = {
  id: string;
  batch_id: string | null;
  upload_id: string | null;
  client_id: string | null;
  file_name: string | null;
  file_path: string | null;
  bureau: string | null;
  match_confidence: number;
  match_reason: string | null;
  extraction_status: string;
  approval_status: string;
  extracted_scores: Record<string, unknown>;
  extracted_negative_accounts: unknown[];
  extracted_inquiries: unknown[];
  extracted_personal_info: unknown[];
  extraction_summary: Record<string, unknown>;
  admin_notes: string | null;
  approved_at: string | null;
  committed_at: string | null;
  created_at: string;
  clients?: { full_name: string | null; email: string | null } | null;
  report_extraction_batches?: { batch_label: string | null; status: string | null } | null;
};

function normalize(value?: string | null) {
  return (value || '').toLowerCase();
}

function statusBadge(status: string) {
  if (status === 'approved') return <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>;
  if (status === 'rejected') return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
  if (status === 'committed') return <Badge className="bg-blue-600"><ClipboardCheck className="mr-1 h-3 w-3" />Committed</Badge>;
  return <Badge variant="secondary">Pending Review</Badge>;
}

function countJsonArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

export default function ReportExtractionApprovalQueue() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [committingId, setCommittingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const db: any = supabase;
      const { data, error } = await db
        .from('report_extraction_reviews')
        .select('*, clients(full_name,email), report_extraction_batches(batch_label,status)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setRows((data || []) as ReviewRow[]);
      setNotes(Object.fromEntries((data || []).map((row: any) => [row.id, row.admin_notes || ''])));
    } catch (error) {
      console.error('Unable to load report extraction reviews:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return rows;
    return rows.filter((row) => [row.file_name, row.bureau, row.clients?.full_name, row.clients?.email, row.report_extraction_batches?.batch_label]
      .filter(Boolean)
      .some((value) => normalize(String(value)).includes(q)));
  }, [query, rows]);

  const pending = rows.filter((row) => row.approval_status === 'pending_review').length;
  const approved = rows.filter((row) => row.approval_status === 'approved').length;
  const rejected = rows.filter((row) => row.approval_status === 'rejected').length;
  const committed = rows.filter((row) => row.approval_status === 'committed').length;

  const updateStatus = async (id: string, approvalStatus: 'approved' | 'rejected') => {
    const db: any = supabase;
    const { error } = await db
      .from('report_extraction_reviews')
      .update({
        approval_status: approvalStatus,
        approved_at: approvalStatus === 'approved' ? new Date().toISOString() : null,
        admin_notes: notes[id] || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) {
      console.error('Unable to update approval status:', error);
      setMessage('Unable to update approval status.');
      return;
    }
    setMessage(`Review ${approvalStatus}.`);
    await load();
  };

  const commitReview = async (id: string) => {
    setCommittingId(id);
    setMessage(null);
    try {
      const db: any = supabase;
      const { error } = await db.rpc('commit_report_extraction_review', { p_review_id: id });
      if (error) throw error;
      setMessage('Approved review committed to client portal successfully.');
      await load();
    } catch (error: any) {
      console.error('Unable to commit review:', error);
      setMessage(error?.message || 'Unable to commit this review.');
    } finally {
      setCommittingId(null);
    }
  };

  return (
    <AdminShell title="Extraction Approval Queue" subtitle="Review staged credit report extraction results before anything is committed to a client portal">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle>Pending</CardTitle><CardDescription>Needs admin review</CardDescription></CardHeader><CardContent className="text-3xl font-black">{loading ? '—' : pending}</CardContent></Card>
          <Card><CardHeader><CardTitle>Approved</CardTitle><CardDescription>Ready for commit phase</CardDescription></CardHeader><CardContent className="text-3xl font-black text-emerald-600">{loading ? '—' : approved}</CardContent></Card>
          <Card><CardHeader><CardTitle>Rejected</CardTitle><CardDescription>Blocked from commit</CardDescription></CardHeader><CardContent className="text-3xl font-black text-destructive">{loading ? '—' : rejected}</CardContent></Card>
          <Card><CardHeader><CardTitle>Committed</CardTitle><CardDescription>Applied to portal history</CardDescription></CardHeader><CardContent className="text-3xl font-black text-blue-600">{loading ? '—' : committed}</CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div><CardTitle>Review Queue</CardTitle><CardDescription>Approve, reject, or commit extraction records into the client-visible report pipeline.</CardDescription></div>
              <Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, email, file, bureau, or batch" />
            </div>
            {message && <p className="mb-4 rounded-xl border bg-muted/40 p-3 text-sm">{message}</p>}
            <div className="space-y-4">
              {filtered.map((row) => {
                const canCommit = row.approval_status === 'approved' && Boolean(row.client_id);
                return (
                  <div key={row.id} className="rounded-2xl border p-4">
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{row.clients?.full_name || 'Unassigned client'}</p>
                          {statusBadge(row.approval_status)}
                          <Badge variant="outline">{row.bureau || 'Unknown bureau'}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{row.clients?.email || 'No email'} · {row.file_name || 'No file name'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Batch: {row.report_extraction_batches?.batch_label || row.batch_id || 'No batch'} · Match {row.match_confidence}% · {row.match_reason || 'No match reason'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Scores</p><p className="font-bold">{Object.keys(row.extracted_scores || {}).length}</p></div>
                        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Negatives</p><p className="font-bold">{countJsonArray(row.extracted_negative_accounts)}</p></div>
                        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Inquiries</p><p className="font-bold">{countJsonArray(row.extracted_inquiries)}</p></div>
                        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Personal Info</p><p className="font-bold">{countJsonArray(row.extracted_personal_info)}</p></div>
                      </div>
                      <div className="flex flex-col gap-2 lg:w-52">
                        <Button disabled={row.approval_status === 'approved' || row.approval_status === 'committed'} onClick={() => updateStatus(row.id, 'approved')}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>
                        <Button disabled={!canCommit || committingId === row.id} onClick={() => commitReview(row.id)} className="bg-blue-600 hover:bg-blue-700"><ClipboardCheck className="mr-2 h-4 w-4" />{committingId === row.id ? 'Committing…' : 'Commit Approved'}</Button>
                        <Button variant="destructive" disabled={row.approval_status === 'rejected' || row.approval_status === 'committed'} onClick={() => updateStatus(row.id, 'rejected')}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Textarea value={notes[row.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))} placeholder="Admin notes for this extraction review" />
                    </div>
                  </div>
                );
              })}
              {!loading && filtered.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">No extraction reviews found.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
