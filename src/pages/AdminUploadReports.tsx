import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileCheck } from 'lucide-react';
import { ClientMatchEnginePanel } from '@/components/admin/ClientMatchEnginePanel';
import { RecentReportMatches } from '@/components/admin/RecentReportMatches';
import { MatchResult } from '@/lib/clientMatchEngine';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const REPORT_STAGES = [
  { value: 'before', label: 'Before Report' },
  { value: 'updated', label: 'Updated Report' },
  { value: 'current', label: 'Current Report' },
  { value: 'final', label: 'Final Report' },
];
const BUREAUS = [
  { value: 'experian', label: 'Experian' },
  { value: 'equifax', label: 'Equifax' },
  { value: 'transunion', label: 'TransUnion' },
  { value: '3_bureau', label: '3-Bureau Report' },
];

export default function AdminUploadReports() {
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();
  const initialClient = params.get('clientId') || '';
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState(initialClient);
  const [stage, setStage] = useState('current');
  const [bureau, setBureau] = useState('3_bureau');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<MatchResult | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, full_name, email, phone, ssn_last4, dob, user_id')
        .order('full_name');
      setClients(data || []);
    })();
  }, []);

  const selectedClient = clients.find((c) => c.id === clientId);

  const applyMatch = (m: MatchResult) => {
    setClientId(m.clientId);
    setParams({ clientId: m.clientId });
    toast({
      title: 'Client matched',
      description: `${m.fullName} (${m.confidence}%) — ${m.reasons.join(', ')}`,
    });
  };

  const handleUpload = async () => {
    if (!clientId) return toast({ title: 'Pick a client', variant: 'destructive' });
    if (!file) return toast({ title: 'Choose a file', variant: 'destructive' });
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const path = `${clientId}/${Date.now()}_${stage}_${bureau}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('credit-reports').upload(path, file);
      if (upErr) throw upErr;

      const client: any = supabase;
      const { data: inserted, error: insertErr } = await client
        .from('credit_report_uploads')
        .insert({
          client_id: clientId,
          user_id: selectedClient?.user_id ?? user.id,
          file_name: file.name,
          file_path: path,
          report_type: stage,
          bureau,
          analysis_status: 'pending',
          uploaded_by: user.id,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      // Phase 6: verify client linkage via deterministic matcher
      try {
        await supabase.functions.invoke('match-report-to-client', {
          body: {
            report_id: inserted?.id,
            source: 'credit_report_uploads',
            name: selectedClient?.full_name,
            email: selectedClient?.email,
            phone: selectedClient?.phone,
            ssn_last4: selectedClient?.ssn_last4,
            dob: selectedClient?.dob,
          },
        });
      } catch (matchErr) {
        console.warn('[match-report-to-client] non-fatal:', matchErr);
      }

      await client.from('client_activity_timeline').insert({
        client_id: clientId,
        user_id: selectedClient?.user_id ?? user.id,
        event_type: 'report_uploaded',
        title: `${stage[0].toUpperCase() + stage.slice(1)} report uploaded`,
        description: `${BUREAUS.find((b) => b.value === bureau)?.label} · ${file.name}`,
        visible_to_client: true,
      });

      toast({ title: 'Report uploaded', description: 'Attached to selected client.' });
      setFile(null);
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message ?? 'Try again', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminShell title="Upload Reports" subtitle="Attach a credit report to a specific client">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Workflow</CardTitle>
            <CardDescription>Choose client, stage, bureau, then upload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Client</Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setParams({ clientId: v }); }}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name} — {c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClient && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: <Badge variant="secondary">{selectedClient.full_name}</Badge>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Report Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REPORT_STAGES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bureau</Label>
                <Select value={bureau} onValueChange={setBureau}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BUREAUS.map((b) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>PDF File</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button className="w-full" onClick={handleUpload} disabled={uploading || !file || !clientId}>
              {uploading ? 'Uploading...' : 'Upload to Client'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <ClientMatchEnginePanel
            selectedClientId={clientId || null}
            onAutoMatch={applyMatch}
            onConfirmMatch={(m) => setPendingConfirm(m)}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileCheck className="h-4 w-4" /> Safety Checks</CardTitle>
              <CardDescription>Reports are always tied to the explicit clients.id (never auth.uid()).</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• File stored in <code className="text-foreground">credit-reports</code> under <code className="text-foreground">{`<clientId>/<timestamp>_<stage>_<bureau>_<name>`}</code>.</p>
              <p>• Row inserted in <code className="text-foreground">credit_report_uploads</code> with <code className="text-foreground">client_id</code> + the client's <code className="text-foreground">user_id</code>.</p>
              <p>• Confidence ≥ 95% auto-matches. 80–94% requires confirmation. Below 80% requires manual selection.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-5xl mt-4">
        <RecentReportMatches clientId={clientId || null} />
      </div>

      <AlertDialog open={!!pendingConfirm} onOpenChange={(o) => !o && setPendingConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm client match</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingConfirm && (
                <>
                  Attach uploads to <strong>{pendingConfirm.fullName}</strong> ({pendingConfirm.email ?? 'no email'})?
                  <br />Confidence: {pendingConfirm.confidence}%. {pendingConfirm.reasons.join(', ')}.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingConfirm) applyMatch(pendingConfirm); setPendingConfirm(null); }}>
              Confirm &amp; use
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}