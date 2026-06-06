import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/luxury/StatusBadge';

interface Props {
  userId: string;
  clientId: string;
  onJumpTab?: (tabId: string) => void;
}

interface Step {
  id: string;
  label: string;
  done: boolean;
  tab?: string;
}

export function OnboardingChecklist({ userId, clientId, onJumpTab }: Props) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [profile, idDoc, ssnDoc, report, agreement, dispute] = await Promise.all([
        supabase.from('profiles').select('first_name,last_name,date_of_birth').eq('user_id', userId).maybeSingle(),
        supabase.from('document_archive').select('id').eq('user_id', userId).eq('document_type', 'government_id').limit(1),
        supabase.from('document_archive').select('id').eq('user_id', userId).eq('document_type', 'ssn').limit(1),
        supabase.from('credit_reports').select('id').eq('client_id', clientId).limit(1),
        supabase.from('client_agreements').select('id').eq('user_id', userId).limit(1),
        supabase.from('dispute_letters').select('id').eq('client_id', clientId).limit(1),
      ]);
      if (cancelled) return;
      const p = profile.data as any;
      setSteps([
        { id: 'profile', label: 'Complete your profile', done: !!(p?.first_name && p?.last_name && p?.date_of_birth) },
        { id: 'id', label: 'Upload government-issued ID', done: (idDoc.data?.length || 0) > 0, tab: 'documents' },
        { id: 'ssn', label: 'Provide SSN on file', done: (ssnDoc.data?.length || 0) > 0, tab: 'documents' },
        { id: 'report', label: 'Upload your credit report', done: (report.data?.length || 0) > 0, tab: 'credit-reports' },
        { id: 'agreement', label: 'Sign your service agreement', done: (agreement.data?.length || 0) > 0, tab: 'agreement' },
        { id: 'dispute', label: 'First dispute submitted', done: (dispute.data?.length || 0) > 0, tab: 'dispute-letters' },
      ]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId, clientId]);

  const completed = steps.filter(s => s.done).length;
  const total = steps.length || 1;
  const pct = Math.round((completed / total) * 100);

  return (
    <section className="lux-surface p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="lux-eyebrow">Client Onboarding</p>
          <h3 className="lux-display text-lg text-foreground mt-1">Your setup checklist</h3>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {completed} of {total} complete
        </span>
      </div>
      <Progress value={pct} className="h-1.5 mb-5 bg-secondary" />
      {loading ? (
        <div className="py-6 flex items-center justify-center text-muted-foreground gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading checklist
        </div>
      ) : (
        <ul className="space-y-2">
          {steps.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3 md:p-4 transition-colors hover:border-gold-soft/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <StatusBadge status={s.done ? 'completed' : 'pending'} label={s.done ? 'Done' : 'Pending'} />
                <span className={`text-sm ${s.done ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                  {s.label}
                </span>
              </div>
              {!s.done && s.tab && onJumpTab && (
                <Button size="sm" variant="outline" className="h-8" onClick={() => onJumpTab(s.tab!)}>
                  Open
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}