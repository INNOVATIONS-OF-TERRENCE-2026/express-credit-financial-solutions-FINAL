import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { resolveClient as resolveClientId } from '@/lib/resolveClient';
import { Save, Zap, CreditCard, FileSignature, Download } from 'lucide-react';
import { CreditReportVersionHistory } from './CreditReportVersionHistory';
import { ClientPaymentInfo } from './admin/ClientPaymentInfo';

interface ClientData {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string;
  dob: string;
  ssn_last4: string;
  membership_plan: string | null;
  user_id: string | null;
}

interface CreditScores {
  experian_score: number | null;
  equifax_score: number | null;
  transunion_score: number | null;
}

interface AdminClientEditorProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function AdminClientEditor({ clientId, open, onOpenChange, onSaved }: AdminClientEditorProps) {
  const { toast } = useToast();
  const [client, setClient] = useState<ClientData | null>(null);
  const [originalClient, setOriginalClient] = useState<ClientData | null>(null);
  const [scores, setScores] = useState<CreditScores>({ experian_score: null, equifax_score: null, transunion_score: null });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const SCORE_LABELS: Record<string, string> = {
    experian_score: 'Experian',
    equifax_score: 'Equifax',
    transunion_score: 'TransUnion',
  };
  const FIELD_LABELS: Record<string, string> = {
    full_name: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    dob: 'Date of Birth',
    ssn_last4: 'SSN Last 4',
    membership_plan: 'Membership Plan',
  };

  const computeDiff = () => {
    const fieldDiff: { key: string; label: string; from: any; to: any }[] = [];
    if (originalClient && client) {
      (Object.keys(FIELD_LABELS) as (keyof ClientData)[]).forEach(k => {
        const before = (originalClient as any)?.[k] ?? null;
        const after = (client as any)?.[k] ?? null;
        if ((before ?? '') !== (after ?? '')) {
          fieldDiff.push({ key: k as string, label: FIELD_LABELS[k as string], from: before, to: after });
        }
      });
    }
    const scoreDiff: { key: string; label: string; from: any; to: any }[] = [];
    (['experian_score','equifax_score','transunion_score'] as const).forEach(k => {
      const before = (originalClient as any)?.[k] ?? null;
      const after = (scores as any)[k] ?? null;
      // originals on clients table may not carry scores; only flag when an explicit new value is set
      if (after !== before && after != null) {
        scoreDiff.push({ key: k, label: SCORE_LABELS[k], from: before, to: after });
      }
    });
    return { fieldDiff, scoreDiff };
  };

  useEffect(() => {
    if (clientId && open) fetchClient();
    if (!open) { setClient(null); setOriginalClient(null); setNotFound(false); setAgreements([]); }
  }, [clientId, open]);

  const fetchClient = async () => {
    if (!clientId) return;
    setLoading(true);
    setNotFound(false);
    try {
      const resolved = await resolveClientId(clientId);
      const actualId = resolved?.clientId || clientId;
      const [{ data: c, error: cErr }, { data: s }, { data: ags }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', actualId).maybeSingle(),
        supabase.from('client_credit_scores' as any).select('*').eq('client_id', actualId).maybeSingle(),
        supabase.from('client_agreements').select('id,full_name,signed_at,agreement_version,signed_pdf_path,created_at').eq('client_id', actualId).order('created_at', { ascending: false }),
      ]);
      if (cErr) throw cErr;
      if (!c) { setClient(null); setNotFound(true); return; }
      setClient(c as ClientData);
      setOriginalClient(c as ClientData);
      setAgreements((ags as any) || []);
      if (s) {
        const scoreData = s as any;
        setScores({ experian_score: scoreData.experian_score, equifax_score: scoreData.equifax_score, transunion_score: scoreData.transunion_score });
      } else {
        setScores({ experian_score: null, equifax_score: null, transunion_score: null });
      }
    } catch (err: any) {
      toast({ title: 'Error loading client', description: err?.message || 'Could not load client data', variant: 'destructive' });
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const requestSave = () => {
    if (!client) return;
    setShowConfirm(true);
  };

  const handleSave = async () => {
    if (!client) return;
    setShowConfirm(false);
    setSaving(true);
    try {
      // Compute diff vs originals for audit log
      const tracked: (keyof ClientData)[] = ['full_name','email','phone','address','dob','ssn_last4','membership_plan'];
      const diff: Record<string, { from: any; to: any }> = {};
      tracked.forEach(k => {
        const before = (originalClient as any)?.[k] ?? null;
        const after = (client as any)?.[k] ?? null;
        if (before !== after) diff[k] = { from: before, to: after };
      });

      const { error: clientErr } = await supabase.from('clients')
        .update({ full_name: client.full_name, email: client.email, phone: client.phone, address: client.address, dob: client.dob, ssn_last4: client.ssn_last4, membership_plan: client.membership_plan, updated_at: new Date().toISOString() })
        .eq('id', client.id);
      if (clientErr) throw clientErr;

      // Upsert credit scores
      const { error: scoreErr } = await supabase.from('client_credit_scores' as any)
        .upsert({ client_id: client.id, user_id: client.user_id, ...scores, source: 'manual', updated_at: new Date().toISOString() } as any, { onConflict: 'client_id' });
      if (scoreErr) throw scoreErr;

      // Audit log — separate entries for membership and field edits
      if (diff.membership_plan) {
        await supabase.rpc('log_security_event', {
          p_action: 'CLIENT_MEMBERSHIP_CHANGED',
          p_table_name: 'clients',
          p_record_id: client.id,
          p_details: { client_id: client.id, change: diff.membership_plan },
          p_security_level: 'info',
          p_risk_score: 2,
        });
      }
      const fieldDiff = Object.fromEntries(Object.entries(diff).filter(([k]) => k !== 'membership_plan'));
      if (Object.keys(fieldDiff).length > 0) {
        await supabase.rpc('log_security_event', {
          p_action: 'CLIENT_FIELDS_UPDATED',
          p_table_name: 'clients',
          p_record_id: client.id,
          p_details: { client_id: client.id, changes: fieldDiff },
          p_security_level: 'info',
          p_risk_score: 2,
        });
      }

      toast({ title: 'Client Updated', description: 'All changes saved successfully.' });
      setOriginalClient({ ...client });
      // Fire automation events
      try {
        await supabase.functions.invoke('process-automation-event', {
          body: { event_type: 'client_profile_updated', client_id: client.id, user_id: client.user_id, payload: { updated_by: 'admin' }, source: 'admin_editor' },
        });
        if (scores.experian_score || scores.equifax_score || scores.transunion_score) {
          await supabase.functions.invoke('process-automation-event', {
            body: { event_type: 'score_updated', client_id: client.id, user_id: client.user_id, payload: scores, source: 'admin_editor' },
          });
        }
      } catch (autoErr) { console.log('Automation event skipped:', autoErr); }
      onSaved?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDisputes = async () => {
    if (!client) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-dispute-ai', {
        body: { client_id: client.id, mode: 'manual' },
      });
      if (error) throw error;
      toast({ title: 'Disputes Generated', description: `${data?.cases_created || 0} dispute cases created.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const downloadAgreement = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('client-agreements').createSignedUrl(path, 300);
      if (error || !data?.signedUrl) throw error || new Error('No signed URL');
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' });
    }
  };

  const updateField = (field: keyof ClientData, value: string) => {
    if (!client) return;
    setClient({ ...client, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {client ? `Edit Client: ${client.full_name}` : loading ? 'Loading client…' : 'Edit Client'}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading client data…</p>
          </div>
        )}

        {!loading && notFound && (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Client record not found.</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}

        {!loading && !notFound && client && (
        <div className="space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input value={client.full_name} onChange={e => updateField('full_name', e.target.value)} /></div>
            <div><Label>Email</Label><Input value={client.email || ''} onChange={e => updateField('email', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={client.phone} onChange={e => updateField('phone', e.target.value)} /></div>
            <div><Label>Address</Label><Input value={client.address} onChange={e => updateField('address', e.target.value)} /></div>
            <div><Label>Date of Birth</Label><Input type="date" value={client.dob} onChange={e => updateField('dob', e.target.value)} /></div>
            <div><Label>SSN Last 4</Label><Input value={client.ssn_last4} maxLength={4} onChange={e => updateField('ssn_last4', e.target.value)} /></div>
            <div>
              <Label>Membership Plan</Label>
              <Select value={client.membership_plan || 'Basic'} onValueChange={v => updateField('membership_plan', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Elite">Elite</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Credit Scores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> Credit Scores <Badge variant="outline">Admin Override</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Experian</Label>
                  <Input type="number" min={300} max={850} placeholder="---" value={scores.experian_score ?? ''} onChange={e => setScores({ ...scores, experian_score: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <Label className="text-xs">Equifax</Label>
                  <Input type="number" min={300} max={850} placeholder="---" value={scores.equifax_score ?? ''} onChange={e => setScores({ ...scores, equifax_score: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <Label className="text-xs">TransUnion</Label>
                  <Input type="number" min={300} max={850} placeholder="---" value={scores.transunion_score ?? ''} onChange={e => setScores({ ...scores, transunion_score: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={requestSave} disabled={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={handleGenerateDisputes} disabled={generating} variant="outline">
              <Zap className="h-4 w-4 mr-2" />{generating ? 'Generating...' : 'Generate Disputes'}
            </Button>
          </div>

          {/* Signed Agreements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><FileSignature className="h-4 w-4 text-primary" /> Signed Agreements <Badge variant="outline">{agreements.length}</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              {agreements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No signed agreements on file for this client yet.</p>
              ) : (
                <ul className="space-y-2">
                  {agreements.map(a => (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.full_name}</p>
                        <p className="text-xs text-muted-foreground">{a.agreement_version || 'v1.0'} · {new Date(a.signed_at || a.created_at).toLocaleString()}</p>
                      </div>
                      {a.signed_pdf_path ? (
                        <Button size="sm" variant="outline" className="h-9" onClick={() => downloadAgreement(a.signed_pdf_path)}>
                          <Download className="h-4 w-4 mr-1" /> PDF
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Legacy</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Credit Report Versions */}
          <CreditReportVersionHistory clientId={client.id} />

          {/* Latest Payment */}
          <Card>
            <CardHeader><CardTitle className="text-base">Latest Payment</CardTitle></CardHeader>
            <CardContent>
              <ClientPaymentInfo userId={client.user_id} variant="block" />
            </CardContent>
          </Card>
        </div>
        )}

        {client && (
          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Confirm changes for {client.full_name}</DialogTitle>
                <DialogDescription>
                  Review the pending updates below. Nothing is saved until you confirm.
                </DialogDescription>
              </DialogHeader>
              {(() => {
                const { fieldDiff, scoreDiff } = computeDiff();
                if (fieldDiff.length === 0 && scoreDiff.length === 0) {
                  return <p className="text-sm text-muted-foreground py-4">No changes detected.</p>;
                }
                const Row = ({ label, from, to }: { label: string; from: any; to: any }) => (
                  <div className="grid grid-cols-[140px_1fr] gap-2 text-sm py-1.5 border-b border-border/40 last:border-0">
                    <span className="font-medium">{label}</span>
                    <span className="min-w-0">
                      <span className="line-through text-muted-foreground break-words">{from ? String(from) : <em className="opacity-60">empty</em>}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="text-emerald-500 font-medium break-words">{to ? String(to) : <em className="opacity-60">empty</em>}</span>
                    </span>
                  </div>
                );
                return (
                  <div className="max-h-80 overflow-auto">
                    {fieldDiff.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Profile</p>
                        {fieldDiff.map(d => <Row key={d.key} label={d.label} from={d.from} to={d.to} />)}
                      </div>
                    )}
                    {scoreDiff.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Credit Scores</p>
                        {scoreDiff.map(d => <Row key={d.key} label={d.label} from={d.from ?? '—'} to={d.to} />)}
                      </div>
                    )}
                  </div>
                );
              })()}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />{saving ? 'Saving…' : 'Confirm & Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
