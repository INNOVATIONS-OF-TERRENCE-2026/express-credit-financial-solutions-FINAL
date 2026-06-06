import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, RefreshCw, Search, UploadCloud, XCircle } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

type RegistryClient = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  ssn_last4: string | null;
  user_id: string | null;
};

type StagedReport = {
  id: string;
  file: File;
  bureau: string;
  status: 'staged' | 'ready' | 'warning' | 'blocked';
  matchedClientId: string | null;
  confidence: number;
  reason: string;
};

const MAX_FILES = 10;
const ACCEPTED_TYPES = ['application/pdf'];

function guessBureau(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.includes('experian') || lower.includes('_ex') || lower.includes('-ex')) return 'Experian';
  if (lower.includes('equifax') || lower.includes('_eq') || lower.includes('-eq')) return 'Equifax';
  if (lower.includes('transunion') || lower.includes('trans union') || lower.includes('_tu') || lower.includes('-tu')) return 'TransUnion';
  if (lower.includes('identityiq')) return 'IdentityIQ';
  if (lower.includes('smartcredit')) return 'SmartCredit';
  return 'Unknown';
}

function normalize(value?: string | null) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function scoreMatch(fileName: string, client: RegistryClient) {
  const file = normalize(fileName);
  const name = normalize(client.full_name);
  const emailPrefix = normalize(client.email?.split('@')[0]);
  const phone = normalize(client.phone);
  const ssn4 = normalize(client.ssn_last4);

  let score = 0;
  const reasons: string[] = [];

  if (name && file.includes(name)) {
    score += 70;
    reasons.push('filename contains full name');
  } else if (client.full_name) {
    const parts = client.full_name.split(/\s+/).map(normalize).filter((part) => part.length > 2);
    const hits = parts.filter((part) => file.includes(part)).length;
    if (hits >= 2) {
      score += 45;
      reasons.push('filename contains multiple name parts');
    } else if (hits === 1) {
      score += 20;
      reasons.push('filename contains one name part');
    }
  }

  if (emailPrefix && file.includes(emailPrefix)) {
    score += 20;
    reasons.push('filename contains email prefix');
  }
  if (phone && phone.length >= 7 && file.includes(phone.slice(-7))) {
    score += 15;
    reasons.push('filename contains phone tail');
  }
  if (ssn4 && file.includes(ssn4)) {
    score += 25;
    reasons.push('filename contains SSN last4');
  }

  return { score: Math.min(score, 100), reason: reasons.join(', ') || 'no strong filename match' };
}

function bestMatch(fileName: string, clients: RegistryClient[]) {
  const ranked = clients
    .map((client) => ({ client, ...scoreMatch(fileName, client) }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  if (!top || top.score < 35) return { clientId: null, confidence: top?.score || 0, reason: top?.reason || 'no match' };
  return { clientId: top.client.id, confidence: top.score, reason: top.reason };
}

function statusFor(confidence: number, clientId: string | null): StagedReport['status'] {
  if (!clientId) return 'blocked';
  if (confidence >= 70) return 'ready';
  return 'warning';
}

function statusBadge(status: StagedReport['status']) {
  if (status === 'ready') return <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Ready</Badge>;
  if (status === 'warning') return <Badge variant="secondary"><AlertTriangle className="mr-1 h-3 w-3" />Review</Badge>;
  if (status === 'blocked') return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Blocked</Badge>;
  return <Badge variant="outline">Staged</Badge>;
}

export default function BatchReportIngestion() {
  const [clients, setClients] = useState<RegistryClient[]>([]);
  const [staged, setStaged] = useState<StagedReport[]>([]);
  const [batchLabel, setBatchLabel] = useState(`Batch ${new Date().toLocaleDateString()}`);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id,full_name,email,phone,dob,ssn_last4,user_id')
      .eq('not_a_client', false)
      .order('full_name', { ascending: true });
    if (error) {
      console.error('Unable to load clients for ingestion:', error);
      setClients([]);
      return;
    }
    setClients((data || []) as RegistryClient[]);
  };

  useEffect(() => { loadClients(); }, []);

  const selectedClientMap = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const readyCount = staged.filter((item) => item.status === 'ready').length;
  const reviewCount = staged.filter((item) => item.status === 'warning').length;
  const blockedCount = staged.filter((item) => item.status === 'blocked').length;

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfs = files.filter((file) => ACCEPTED_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.pdf')).slice(0, MAX_FILES);
    const next = pdfs.map((file) => {
      const match = bestMatch(file.name, clients);
      return {
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
        bureau: guessBureau(file.name),
        status: statusFor(match.confidence, match.clientId),
        matchedClientId: match.clientId,
        confidence: match.confidence,
        reason: match.reason,
      } satisfies StagedReport;
    });
    setStaged(next);
    setMessage(files.length > MAX_FILES ? `Only the first ${MAX_FILES} PDF files were staged.` : null);
  };

  const updateMatch = (id: string, clientId: string) => {
    setStaged((rows) => rows.map((row) => row.id === id ? {
      ...row,
      matchedClientId: clientId,
      confidence: 100,
      reason: 'manual admin override',
      status: 'ready',
    } : row));
  };

  const updateBureau = (id: string, bureau: string) => {
    setStaged((rows) => rows.map((row) => row.id === id ? { ...row, bureau } : row));
  };

  const uploadDryRun = async () => {
    const uploadable = staged.filter((item) => item.matchedClientId && item.status !== 'blocked');
    if (uploadable.length === 0) {
      setMessage('No reports are ready for staging. Match at least one file to a client first.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage(null);

    try {
      for (let i = 0; i < uploadable.length; i += 1) {
        const item = uploadable[i];
        const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `report-ingestion/${item.matchedClientId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('credit-reports')
          .upload(path, item.file, { upsert: false, contentType: 'application/pdf' });
        if (uploadError) throw uploadError;

        await supabase.from('credit_report_uploads').insert({
          client_id: item.matchedClientId,
          file_name: item.file.name,
          file_path: path,
          bureau: item.bureau,
          status: 'dry_run_staged',
          source: 'batch_ingestion',
          notes: `${batchLabel} · confidence ${item.confidence}% · ${item.reason}`,
        } as any);

        setUploadProgress(Math.round(((i + 1) / uploadable.length) * 100));
      }
      setMessage(`${uploadable.length} report(s) staged in dry-run mode. No client scores or dispute data were overwritten.`);
    } catch (error) {
      console.error('Batch ingestion upload failed:', error);
      setMessage('Upload failed. Check storage/table permissions and retry.');
    } finally {
      setUploading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => [client.full_name, client.email, client.phone, client.ssn_last4]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)));
  }, [clients, query]);

  return (
    <AdminShell title="Batch Report Ingestion" subtitle="Stage up to 10 PDF credit reports with dry-run matching before committing updates">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle>Staged</CardTitle><CardDescription>PDF files selected</CardDescription></CardHeader><CardContent className="text-3xl font-black">{staged.length}</CardContent></Card>
          <Card><CardHeader><CardTitle>Ready</CardTitle><CardDescription>Matched with high confidence</CardDescription></CardHeader><CardContent className="text-3xl font-black text-emerald-600">{readyCount}</CardContent></Card>
          <Card><CardHeader><CardTitle>Review</CardTitle><CardDescription>Manual confirmation recommended</CardDescription></CardHeader><CardContent className="text-3xl font-black text-amber-600">{reviewCount}</CardContent></Card>
          <Card><CardHeader><CardTitle>Blocked</CardTitle><CardDescription>No client match selected</CardDescription></CardHeader><CardContent className="text-3xl font-black text-destructive">{blockedCount}</CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Upload Batch</CardTitle><CardDescription>Upload up to 10 PDF reports. This phase stages files only; it does not overwrite client scores or portal results.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="batch-label">Batch label</Label><Input id="batch-label" value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="client-search">Client override search</Label><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="client-search" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search registry while matching" /></div></div>
            </div>
            <Label htmlFor="report-files" className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center hover:bg-muted/40">
              <UploadCloud className="mb-3 h-8 w-8 text-muted-foreground" />
              <span className="font-semibold">Select PDF credit reports</span>
              <span className="text-sm text-muted-foreground">Maximum {MAX_FILES} files · PDF only · dry-run staging</span>
              <Input id="report-files" className="sr-only" type="file" multiple accept="application/pdf,.pdf" onChange={onFiles} />
            </Label>
            {uploading && <Progress value={uploadProgress} />}
            {message && <p className="rounded-xl border bg-muted/40 p-3 text-sm">{message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dry-Run Matching Preview</CardTitle><CardDescription>Confirm every report belongs to the correct client before staging.</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staged.map((item) => {
                const client = item.matchedClientId ? selectedClientMap.get(item.matchedClientId) : null;
                return (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
                      <div className="min-w-0"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /><p className="truncate font-semibold">{item.file.name}</p>{statusBadge(item.status)}</div><p className="mt-1 text-xs text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(2)} MB · confidence {item.confidence}% · {item.reason}</p></div>
                      <Select value={item.bureau} onValueChange={(value) => updateBureau(item.id, value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Experian">Experian</SelectItem><SelectItem value="Equifax">Equifax</SelectItem><SelectItem value="TransUnion">TransUnion</SelectItem><SelectItem value="IdentityIQ">IdentityIQ</SelectItem><SelectItem value="SmartCredit">SmartCredit</SelectItem><SelectItem value="Unknown">Unknown</SelectItem></SelectContent></Select>
                      <Select value={item.matchedClientId || ''} onValueChange={(value) => updateMatch(item.id, value)}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{filteredClients.slice(0, 80).map((clientOption) => <SelectItem key={clientOption.id} value={clientOption.id}>{clientOption.full_name || clientOption.email || clientOption.id}</SelectItem>)}</SelectContent></Select>
                      <div className="text-xs text-muted-foreground lg:text-right">{client ? <><span className="block font-medium text-foreground">{client.full_name}</span><span>{client.email || 'No email'}</span></> : 'No client selected'}</div>
                    </div>
                  </div>
                );
              })}
              {staged.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">No PDF reports staged yet.</div>}
            </div>
            <div className="mt-5 flex justify-end"><Button disabled={uploading || staged.length === 0} onClick={uploadDryRun}><UploadCloud className="mr-2 h-4 w-4" />Stage Dry Run Upload</Button></div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
