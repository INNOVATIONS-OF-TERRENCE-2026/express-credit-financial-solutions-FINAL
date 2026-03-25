import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  clientId?: string;
  userId?: string;
}

export function ScorePredictionCard({ clientId, userId }: Props) {
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    fetchPrediction();
  }, [clientId, userId]);

  const fetchPrediction = async () => {
    let query = supabase.from('score_predictions' as any).select('*').order('created_at', { ascending: false }).limit(1);
    if (clientId) query = query.eq('client_id', clientId);
    else if (userId) query = query.eq('user_id', userId);
    
    const { data } = await query;
    if (data && data.length > 0) setPrediction(data[0]);
  };

  if (!prediction) return null;

  const bureaus = [
    { name: 'Experian', current: prediction.current_experian, min: prediction.predicted_experian_min, max: prediction.predicted_experian_max },
    { name: 'Equifax', current: prediction.current_equifax, min: prediction.predicted_equifax_min, max: prediction.predicted_equifax_max },
    { name: 'TransUnion', current: prediction.current_transunion, min: prediction.predicted_transunion_min, max: prediction.predicted_transunion_max },
  ].filter(b => b.current || b.min);

  if (bureaus.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Projected Score Range
          <Badge variant="outline" className="text-[9px] ml-auto">AI Estimate</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bureaus.map(b => {
          const gain = b.current && b.max ? b.max - b.current : null;
          const progressPct = b.current ? Math.min(((b.current - 300) / 550) * 100, 100) : 0;
          const predictedPct = b.max ? Math.min(((b.max - 300) / 550) * 100, 100) : 0;
          return (
            <div key={b.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{b.name}</span>
                <span className="text-muted-foreground">
                  {b.current || '—'} → {b.min || '—'}–{b.max || '—'}
                  {gain && gain > 0 && <span className="text-green-500 ml-1">(+{gain})</span>}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-muted">
                <div className="absolute h-full rounded-full bg-muted-foreground/30" style={{ width: `${progressPct}%` }} />
                <div className="absolute h-full rounded-full bg-primary/60" style={{ width: `${predictedPct}%` }} />
              </div>
            </div>
          );
        })}
        
        <div className="flex items-start gap-1.5 pt-2 border-t border-border mt-2">
          <AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-tight">
            AI-assisted estimates based on available data. Not guaranteed outcomes. Actual scores may vary.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
