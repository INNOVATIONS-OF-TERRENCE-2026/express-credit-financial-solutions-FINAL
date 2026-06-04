import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Trophy, RefreshCw } from 'lucide-react';

type OverrideFields = {
  starting_score_ex: number | null;
  starting_score_eq: number | null;
  starting_score_tu: number | null;
  current_score_ex: number | null;
  current_score_eq: number | null;
  current_score_tu: number | null;
  accounts_deleted_count: number | null;
  debt_removed_total: number | null;
  hard_inquiries_removed: number | null;
  personal_info_items_removed: number | null;
  remaining_negatives: number | null;
  current_dispute_round: number | null;
  mortgage_readiness_status: string | null;
  ftc_605b_readiness_status: string | null;
  next_step_note: string | null;
};

const EMPTY: OverrideFields = {
  starting_score_ex: null, starting_score_eq: null, starting_score_tu: null,
  current_score_ex: null, current_score_eq: null, current_score_tu: null,
  accounts_deleted_count: null, debt_removed_total: null,
  hard_inquiries_removed: null, personal_info_items_removed: null,
  remaining_negatives: null, current_dispute_round: null,
  mortgage_readiness_status: null, ftc_605b_readiness_status: null,
  next_step_note: null,
};

const num = (v: string) => (v === '' ? null : Number(v));

export function ResultsOverridePanel({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [fields, setFields] = useState<OverrideFields>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('starting_score_ex,starting_score_eq,starting_score_tu,current_score_ex,current_score_eq,current_score_tu,accounts_deleted_count,debt_removed_total,hard_inquiries_removed,personal_info_items_removed,remaining_negatives,current_dispute_round,mortgage_readiness_status,ftc_605b_readiness_status,next_step_note')
      .eq('id', clientId)
      .maybeSingle();
    if (!error && data) setFields({ ...EMPTY, ...(data as any) });
    setLoading(false);
  };

  useEffect(() => { if (clientId) load(); /* eslint-disable-next-line */ }, [clientId]);

  const update = (k: keyof OverrideFields, v: any) => setFields((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ ...fields, updated_at: new Date().toISOString() } as any)
        .eq('id', clientId);
      if (error) throw error;
      toast({ title: 'Results override saved', description: 'Client portal will reflect these values immediately.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Results Override</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Loading…</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" /> Results Override
              <Badge variant="outline">Live Portal Sync</Badge>
            </CardTitle>
            <CardDescription>
              Manually set the bureau scores, deleted accounts, debt removed, and readiness statuses shown on the client portal.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> Reload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Starting Scores */}
        <section>
          <h4 className="text-sm font-semibold mb-2">Starting Bureau Scores</h4>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Starting Experian" value={fields.starting_score_ex} onChange={(v) => update('starting_score_ex', num(v))} type="number" min={300} max={850} />
            <Field label="Starting Equifax" value={fields.starting_score_eq} onChange={(v) => update('starting_score_eq', num(v))} type="number" min={300} max={850} />
            <Field label="Starting TransUnion" value={fields.starting_score_tu} onChange={(v) => update('starting_score_tu', num(v))} type="number" min={300} max={850} />
          </div>
        </section>

        {/* Current Scores */}
        <section>
          <h4 className="text-sm font-semibold mb-2">Current Bureau Scores</h4>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Current Experian" value={fields.current_score_ex} onChange={(v) => update('current_score_ex', num(v))} type="number" min={300} max={850} />
            <Field label="Current Equifax" value={fields.current_score_eq} onChange={(v) => update('current_score_eq', num(v))} type="number" min={300} max={850} />
            <Field label="Current TransUnion" value={fields.current_score_tu} onChange={(v) => update('current_score_tu', num(v))} type="number" min={300} max={850} />
          </div>
        </section>

        {/* Removal Metrics */}
        <section>
          <h4 className="text-sm font-semibold mb-2">Removal Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Accounts Deleted" value={fields.accounts_deleted_count} onChange={(v) => update('accounts_deleted_count', num(v))} type="number" min={0} />
            <Field label="Debt Removed ($)" value={fields.debt_removed_total} onChange={(v) => update('debt_removed_total', num(v))} type="number" min={0} step="0.01" />
            <Field label="Hard Inquiries Removed" value={fields.hard_inquiries_removed} onChange={(v) => update('hard_inquiries_removed', num(v))} type="number" min={0} />
            <Field label="Personal Info Items Removed" value={fields.personal_info_items_removed} onChange={(v) => update('personal_info_items_removed', num(v))} type="number" min={0} />
            <Field label="Remaining Negatives" value={fields.remaining_negatives} onChange={(v) => update('remaining_negatives', num(v))} type="number" min={0} />
            <Field label="Current Dispute Round" value={fields.current_dispute_round} onChange={(v) => update('current_dispute_round', num(v))} type="number" min={0} max={20} />
          </div>
        </section>

        {/* Readiness */}
        <section>
          <h4 className="text-sm font-semibold mb-2">Readiness</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Mortgage Readiness</Label>
              <Select
                value={fields.mortgage_readiness_status ?? 'not_ready'}
                onValueChange={(v) => update('mortgage_readiness_status', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_ready">Not Ready</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="close">Close</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>FTC / 605B Readiness</Label>
              <Select
                value={fields.ftc_605b_readiness_status ?? 'not_eligible'}
                onValueChange={(v) => update('ftc_605b_readiness_status', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_eligible">Not Eligible</SelectItem>
                  <SelectItem value="gathering_docs">Gathering Docs</SelectItem>
                  <SelectItem value="ready_to_file">Ready to File</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Next Step */}
        <section>
          <Label>Next Step Notes (visible on client portal)</Label>
          <Textarea
            rows={3}
            value={fields.next_step_note ?? ''}
            onChange={(e) => update('next_step_note', e.target.value || null)}
            placeholder="e.g. Awaiting bureau response, expected by 6/15. Upload latest utility bill."
          />
        </section>

        <Button onClick={save} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save Results Override'}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label, value, onChange, type = 'text', min, max, step,
}: {
  label: string;
  value: number | string | null;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder="—"
      />
    </div>
  );
}