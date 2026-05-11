import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, Circle, Loader2 } from 'lucide-react';

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
        supabase.from('client_documents').select('id').eq('user_id', userId).eq('document_type', 'government_id').limit(1),
        supabase.from('client_documents').select('id').eq('user_id', userId).eq('document_type', 'ssn').limit(1),
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
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Onboarding Progress</CardTitle>
          <span className="text-xs text-muted-foreground">{completed} of {total} complete</span>
        </div>
        <Progress value={pct} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 flex items-center justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : (
          <ul className="space-y-2">
            {steps.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  {s.done ? (
                    <div className="rounded-full bg-green-500/15 text-green-500 p-1"><Check className="h-4 w-4" /></div>
                  ) : (
                    <div className="rounded-full bg-muted text-muted-foreground p-1"><Circle className="h-4 w-4" /></div>
                  )}
                  <span className={`text-sm ${s.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>{s.label}</span>
                </div>
                {!s.done && s.tab && onJumpTab && (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => onJumpTab(s.tab!)}>Open</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}