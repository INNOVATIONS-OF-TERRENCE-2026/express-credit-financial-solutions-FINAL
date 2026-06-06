import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminCommittedReportsPanel } from '@/components/admin/AdminCommittedReportsPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Upload, Eye, FileText } from 'lucide-react';

const BUREAUS = [
  { value: 'experian', label: 'Experian' },
  { value: 'equifax', label: 'Equifax' },
  { value: 'transunion', label: 'TransUnion' },
  { value: '3_bureau', label: '3-Bureau' },
];
const STAGES = [
  { value: 'before', label: 'Before Report' },
  { value: 'updated', label: 'Updated Report' },
  { value: 'current', label: 'Current Report' },
  { value: 'final', label: 'Final Report' },
];

type ClientRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  status: string | null;
  portal_status: string | null;
  membership_plan: string | null;
  service_status: string | null;
  payment_status: string | null;
  access_services_enabled: boolean | null;
  starting_score_eq: number | null;
  starting_score_tu: number | null;
  starting_score_ex: number | null;
  current_score_eq: number | null;
  current_score_tu: number | null;
  current_score_ex: number | null;
  accounts_deleted_count: number | null;
  debt_removed_total: number | null;
  hard_inquiries_removed: number | null;
  personal_info_items_removed: number | null;
  remaining_negatives: number | null;
  current_dispute_round: number | null;
  next_step_note: string | null;
  client_visible_update: string | null;
  mortgage_readiness_status: string | null;
  ssn_last4?: string | null;
  dob?: string | null;
};

export default function AdminClientPortalEditor() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<ClientRow | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState('current');
  const [bureau, setBureau] = useState('3_bureau');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    load();
  }, [clientId]);

  const load = async () => {
    setLoading(true);
    const sb: any = supabase;
    const { data: c, error } = await sb.from('clients').select('*').eq('id', clientId).maybeSingle();
    if (error || !c) {
      toast({ title: 'Client not found', variant: 'destructive' });
      setLoading(false);
      return;
    }
    setClient(c as ClientRow);
    const { data: r } = await sb
      .from('credit_report_uploads')
      .select('id, file_name, report_type, bureau, uploaded_at, analysis_status')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false })
      .limit(50);
    setReports(r ?? []);
    setLoading(false);
  };

  const set = <K extends keyof ClientRow>(k: K, v: ClientRow[K]) => {
    setClient((p) => (p ? { ...p, [k]: v } : p));
  };

  const saveAll = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const sb: any = supabase;
      const patch: any = {
        status: client.status,
        portal_status: client.portal_status,
        membership_plan: client.membership_plan,
        service_status: client.service_status,
        payment_status: client.payment_status,
        access_services_enabled: client.access_services_enabled,
        starting_score_eq: client.starting_score_eq,
        starting_score_tu: client.starting_score_tu,
        starting_score_ex: client.starting_score_ex,
        current_score_eq: client.current_score_eq,
        current_score_tu: client.current_score_tu,
        current_score_ex: client.current_score_ex,
        accounts_deleted_count: client.accounts_deleted_count,
        debt_removed_total: client.debt_removed_total,
        hard_inquiries_removed: client.hard_inquiries_removed,
        personal_info_items_removed: client.personal_info_items_removed,
        remaining_negatives: client.remaining_negatives,
        current_dispute_round: client.current_dispute_round,
        next_step_note: client.next_step_note,
        client_visible_update: client.client_visible_update,
        mortgage_readiness_status: client.mortgage_readiness_status,
      };
      const { error } = await sb.from('clients').update(patch).eq('id', client.id);
      if (error) throw error;
      toast({ title: 'Saved', description: 'Client portal updated.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const uploadReports = async () => {
    if (!client || !files.length) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      for (const file of files) {
        const path = `${client.id}/${Date.now()}_${stage}_${bureau}_${file.name}`;
        const { error: upErr } = await supabase.storage.from('credit-reports').upload(path, file);
        if (upErr) throw upErr;
        const sb: any = supabase;
        await sb.from('credit_report_uploads').insert({
          client_id: client.id,
          user_id: client.user_id ?? user.id,
          file_name: file.name,
          file_path: path,
          report_type: stage,
          bureau,
          analysis_status: 'pending',
          uploaded_by: user.id,
        });
        await sb.from('client_activity_timeline').insert({
          client_id: client.id,
          user_id: client.user_id ?? user.id,
          event_type: 'report_uploaded',
          title: `${stage[0].toUpperCase() + stage.slice(1)} report uploaded`,
          description: `${BUREAUS.find((b) => b.value === bureau)?.label} · ${file.name}`,
          visible_to_client: true,
        });
      }
      toast({ title: 'Reports uploaded', description: `${files.length} file(s) attached to ${client.full_name}.` });
      setFiles([]);
      load();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <SidebarInset>
            <div className="p-8 text-sm text-muted-foreground">Loading client portal editor…</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!client) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <SidebarInset>
            <div className="p-8 space-y-3">
              <p className="text-sm">Client not found.</p>
              <Button variant="outline" onClick={() => navigate('/admin/clients')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const change = (start: number | null, current: number | null) =>
    start != null && current != null ? current - start : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <SidebarInset>
          <header className="h-14 flex items-center gap-3 border-b border-border/50 px-4">
            <SidebarTrigger />
            <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-base font-semibold truncate">{client.full_name}</h1>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
              {client.status ?? 'active'}
            </Badge>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              {client.membership_plan ?? 'premium'}
            </Badge>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to={`/admin/client-preview/${client.id}`}>
                  <Eye className="h-4 w-4 mr-1" /> Preview Portal
                </Link>
              </Button>
              <Button size="sm" onClick={saveAll} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save All'}
              </Button>
            </div>
          </header>

          <div className="p-4 space-y-4 max-w-6xl">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Client Header</CardTitle>
                <CardDescription className="text-xs">
                  {client.email || 'no email'} · {client.phone || 'no phone'} ·{' '}
                  Portal: <span className={client.user_id ? 'text-emerald-500' : 'text-amber-500'}>
                    {client.user_id ? 'Linked' : 'Not linked'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <SelectField label="Status" value={client.status ?? 'active'} options={['active','paused','closed']} onChange={(v) => set('status', v)} />
                <SelectField label="Portal" value={client.portal_status ?? 'active'} options={['active','pending','disabled']} onChange={(v) => set('portal_status', v)} />
                <SelectField label="Membership" value={client.membership_plan ?? 'premium'} options={['premium','elite','vip','standard']} onChange={(v) => set('membership_plan', v)} />
                <SelectField label="Service" value={client.service_status ?? 'active'} options={['active','paused','closed']} onChange={(v) => set('service_status', v)} />
                <SelectField label="Payment" value={client.payment_status ?? 'active'} options={['active','pending','overdue']} onChange={(v) => set('payment_status', v)} />
              </CardContent>
            </Card>

            <AdminCommittedReportsPanel clientId={client.id} />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Credit Scores</CardTitle>
                <CardDescription className="text-xs">Starting → Current per bureau. Auto-calculates change.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['ex','eq','tu'] as const).map((b) => {
                  const label = b === 'ex' ? 'Experian' : b === 'eq' ? 'Equifax' : 'TransUnion';
                  const startKey = `starting_score_${b}` as const;
                  const curKey = `current_score_${b}` as const;
                  const ch = change(client[startKey], client[curKey]);
                  return (
                    <div key={b} className="rounded-md border border-border/50 p-3">
                      <p className="text-sm font-semibold mb-2">{label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <NumField label="Starting" value={client[startKey]} onChange={(v) => set(startKey, v as any)} />
                        <NumField label="Current"  value={client[curKey]}   onChange={(v) => set(curKey, v as any)} />
                      </div>
                      <p className={`mt-2 text-xs font-semibold ${ch == null ? 'text-muted-foreground' : ch >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        Change: {ch == null ? '—' : (ch >= 0 ? `+${ch}` : ch)} pts
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Credit Results</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <NumField label="Accounts Deleted" value={client.accounts_deleted_count} onChange={(v) => set('accounts_deleted_count', v as any)} />
                <NumField label="Debt Removed ($)" value={client.debt_removed_total} onChange={(v) => set('debt_removed_total', v as any)} />
                <NumField label="Remaining Negatives" value={client.remaining_negatives} onChange={(v) => set('remaining_negatives', v as any)} />
                <NumField label="Inquiries Removed" value={client.hard_inquiries_removed} onChange={(v) => set('hard_inquiries_removed', v as any)} />
                <NumField label="Personal Info Removed" value={client.personal_info_items_removed} onChange={(v) => set('personal_info_items_removed', v as any)} />
                <NumField label="Current Dispute Round" value={client.current_dispute_round} onChange={(v) => set('current_dispute_round', v as any)} />
                <div className="md:col-span-3">
                  <Label className="text-xs">Latest Update (visible to client)</Label>
                  <Textarea rows={2} value={client.client_visible_update ?? ''} onChange={(e) => set('client_visible_update', e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs">Next Step Note</Label>
                  <Textarea rows={2} value={client.next_step_note ?? ''} onChange={(e) => set('next_step_note', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Report Upload Center</CardTitle>
                <CardDescription className="text-xs">
                  Raw uploads are staged here. Portal-visible reports are created through the extraction approval commit pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Report Type</Label>
                    <Select value={stage} onValueChange={setStage}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Bureau</Label>
                    <Select value={bureau} onValueChange={setBureau}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{BUREAUS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Files</Label>
                    <Input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                  </div>
                </div>
                <Button onClick={uploadReports} disabled={uploading || !files.length}>
                  <Upload className="h-4 w-4 mr-1" /> {uploading ? 'Uploading…' : `Upload ${files.length || ''} report(s)`}
                </Button>

                <div className="rounded-md border border-border/50 divide-y divide-border/40">
                  {reports.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground">No raw uploads yet.</p>
                  ) : reports.map((r) => (
                    <div key={r.id} className="p-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{r.file_name}</span>
                        <Badge variant="outline" className="text-[10px]">{r.bureau}</Badge>
                        <Badge variant="outline" className="text-[10px]">{r.report_type}</Badge>
                      </div>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(r.uploaded_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
