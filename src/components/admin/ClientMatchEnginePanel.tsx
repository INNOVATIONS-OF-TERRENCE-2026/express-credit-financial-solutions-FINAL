import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { matchClient, MatchResult } from '@/lib/clientMatchEngine';

interface Props {
  selectedClientId?: string | null;
  onAutoMatch: (m: MatchResult) => void;
  onConfirmMatch: (m: MatchResult) => void;
}

export function ClientMatchEnginePanel({ selectedClientId, onAutoMatch, onConfirmMatch }: Props) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [ssnLast4, setSsnLast4] = useState('');
  const [address, setAddress] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [autoApplied, setAutoApplied] = useState<MatchResult | null>(null);

  const run = async () => {
    setRunning(true);
    setAutoApplied(null);
    try {
      const r = await matchClient({
        selectedClientId: selectedClientId || null,
        email: email || null,
        fullName: fullName || null,
        dob: dob || null,
        ssnLast4: ssnLast4 || null,
        address: address || null,
      });
      setResults(r);
      const top = r[0];
      if (top && top.tier === 'auto') {
        setAutoApplied(top);
        onAutoMatch(top);
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="h-4 w-4" /> Client Match Engine
        </CardTitle>
        <CardDescription>
          Score candidates by email, name, DOB, SSN last 4, and address. 95%+ auto-matches; 80–94% requires confirmation; below 80% requires manual selection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
          </div>
          <div>
            <Label className="text-xs">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <Label className="text-xs">DOB</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">SSN Last 4</Label>
            <Input value={ssnLast4} maxLength={4} onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Atlanta, GA" />
          </div>
        </div>
        <Button className="w-full" onClick={run} disabled={running}>
          {running ? 'Scoring candidates…' : 'Run Match'}
        </Button>

        {autoApplied && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-500" />
            <div>
              <p className="font-medium">Auto-matched: {autoApplied.fullName}</p>
              <p className="text-xs text-muted-foreground">{autoApplied.reasons.join(' · ')}</p>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground">Top candidates</p>
            {results.map((r) => (
              <div key={r.clientId} className="flex items-start justify-between gap-3 rounded-md border border-border p-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{r.fullName}</p>
                    <TierBadge tier={r.tier} confidence={r.confidence} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{r.email ?? 'no email'} — {r.reasons.join(' · ') || 'weak signal'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {r.tier === 'auto' && (
                    <Button size="sm" variant="outline" onClick={() => onAutoMatch(r)}>Use</Button>
                  )}
                  {r.tier === 'confirm' && (
                    <Button size="sm" variant="outline" onClick={() => onConfirmMatch(r)}>Confirm &amp; use</Button>
                  )}
                  {r.tier === 'manual' && (
                    <Button size="sm" variant="ghost" disabled>Manual only</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TierBadge({ tier, confidence }: { tier: MatchResult['tier']; confidence: number }) {
  if (tier === 'auto')
    return <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30"><ShieldCheck className="h-3 w-3 mr-1" />{confidence}%</Badge>;
  if (tier === 'confirm')
    return <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30"><AlertTriangle className="h-3 w-3 mr-1" />{confidence}%</Badge>;
  return <Badge variant="outline"><ShieldAlert className="h-3 w-3 mr-1" />{confidence}%</Badge>;
}