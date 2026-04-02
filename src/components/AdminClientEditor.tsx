import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { resolveClient as resolveClientId } from '@/lib/resolveClient';
import { Save, Zap, CreditCard } from 'lucide-react';

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
  const [scores, setScores] = useState<CreditScores>({ experian_score: null, equifax_score: null, transunion_score: null });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (clientId && open) fetchClient();
  }, [clientId, open]);

  const fetchClient = async () => {
    if (!clientId) return;
    const resolved = await resolveClientId(clientId);
    const actualId = resolved?.clientId || clientId;
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', actualId).single(),
      supabase.from('client_credit_scores' as any).select('*').eq('client_id', actualId).single(),
    ]);
    if (c) setClient(c as ClientData);
    if (s) {
      const scoreData = s as any;
      setScores({ experian_score: scoreData.experian_score, equifax_score: scoreData.equifax_score, transunion_score: scoreData.transunion_score });
    } else {
      setScores({ experian_score: null, equifax_score: null, transunion_score: null });
    }
  };

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const { error: clientErr } = await supabase.from('clients')
        .update({ full_name: client.full_name, email: client.email, phone: client.phone, address: client.address, dob: client.dob, ssn_last4: client.ssn_last4, membership_plan: client.membership_plan, updated_at: new Date().toISOString() })
        .eq('id', client.id);
      if (clientErr) throw clientErr;

      // Upsert credit scores
      const { error: scoreErr } = await supabase.from('client_credit_scores' as any)
        .upsert({ client_id: client.id, user_id: client.user_id, ...scores, source: 'manual', updated_at: new Date().toISOString() } as any, { onConflict: 'client_id' });
      if (scoreErr) throw scoreErr;

      toast({ title: 'Client Updated', description: 'All changes saved successfully.' });
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

  const updateField = (field: keyof ClientData, value: string) => {
    if (!client) return;
    setClient({ ...client, [field]: value });
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Edit Client: {client.full_name}</DialogTitle>
        </DialogHeader>

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
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={handleGenerateDisputes} disabled={generating} variant="outline">
              <Zap className="h-4 w-4 mr-2" />{generating ? 'Generating...' : 'Generate Disputes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
