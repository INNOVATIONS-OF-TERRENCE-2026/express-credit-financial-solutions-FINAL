import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, CheckSquare, FileText, BarChart3, MessageSquare, Settings, Save, Plus, CreditCard } from 'lucide-react';
import { ClientDocumentManager } from '@/components/ClientDocumentManager';

interface ClientProfileDetailProps {
  clientId: string;
  onBack: () => void;
}

interface ActionTracker {
  id: string;
  identity_docs_received: boolean;
  credit_report_uploaded: boolean;
  lexisnexis_frozen: boolean;
  innovis_frozen: boolean;
  work_number_frozen: boolean;
  report_parsed: boolean;
  scores_updated: boolean;
  has_605b: boolean;
  has_ftc: boolean;
  pushed_to_experian: boolean;
  completed: boolean;
}

const ACTION_LABELS: { key: keyof Omit<ActionTracker, 'id'>; label: string }[] = [
  { key: 'identity_docs_received', label: 'Identity Docs Received' },
  { key: 'credit_report_uploaded', label: 'Credit Report Uploaded' },
  { key: 'lexisnexis_frozen', label: 'LexisNexis Frozen' },
  { key: 'innovis_frozen', label: 'Innovis Frozen' },
  { key: 'work_number_frozen', label: 'Work Number Frozen' },
  { key: 'report_parsed', label: 'Report Parsed' },
  { key: 'scores_updated', label: 'Scores Updated' },
  { key: 'has_605b', label: '605B Generated' },
  { key: 'has_ftc', label: 'FTC Report Completed' },
  { key: 'pushed_to_experian', label: 'Experian Upload Completed' },
  { key: 'completed', label: 'Completed' },
];

export function ClientProfileDetail({ clientId, onBack }: ClientProfileDetailProps) {
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [tracker, setTracker] = useState<ActionTracker | null>(null);
  const [scores, setScores] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<any>({});
  const [manualScores, setManualScores] = useState({ experian: '', equifax: '', transunion: '' });

  const fetchAll = useCallback(async () => {
    const [clientRes, trackerRes, scoresRes, notesRes, timelineRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('client_action_tracker' as any).select('*').eq('client_id', clientId).single(),
      supabase.from('client_credit_scores' as any).select('*').eq('client_id', clientId).single(),
      supabase.from('client_notes' as any).select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('client_timeline' as any).select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
    ]);
    if (clientRes.data) {
      setClient(clientRes.data);
      setEditForm(clientRes.data);
    }
    if (trackerRes.data) setTracker(trackerRes.data as any);
    if (scoresRes.data) setScores(scoresRes.data);
    setNotes(notesRes.data || []);
    setTimeline(timelineRes.data || []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleAction = async (key: string, value: boolean) => {
    if (!tracker) return;
    const { error } = await supabase.from('client_action_tracker' as any)
      .update({ [key]: value, updated_at: new Date().toISOString() } as any)
      .eq('client_id', clientId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setTracker(prev => prev ? { ...prev, [key]: value } : prev);
      await supabase.from('client_timeline' as any).insert({
        client_id: clientId,
        event_type: 'action_tracker',
        event_label: `${key.replace(/_/g, ' ')} → ${value ? 'Yes' : 'No'}`,
      });
      toast({ title: 'Updated' });
    }
  };

  const saveClientEdits = async () => {
    const { error } = await supabase.from('clients').update({
      full_name: editForm.full_name,
      email: editForm.email,
      phone: editForm.phone,
      address: editForm.address,
      workflow_status: editForm.workflow_status,
      round_number: editForm.round_number,
      priority_level: editForm.priority_level,
      next_action: editForm.next_action,
      notes_summary: editForm.notes_summary,
    }).eq('id', clientId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Saved', description: 'Client updated' });
      await supabase.from('client_timeline' as any).insert({
        client_id: clientId,
        event_type: 'admin_edit',
        event_label: 'Client profile updated by admin',
      });
      fetchAll();
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { error } = await supabase.from('client_notes' as any).insert({
      client_id: clientId,
      note_body: newNote.trim(),
      note_type: 'general',
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      setNewNote('');
      await supabase.from('client_timeline' as any).insert({
        client_id: clientId,
        event_type: 'note_added',
        event_label: 'Admin note added',
      });
      fetchAll();
    }
  };

  const saveManualScores = async () => {
    const updates: any = {};
    if (manualScores.experian) updates.experian_score = parseInt(manualScores.experian);
    if (manualScores.equifax) updates.equifax_score = parseInt(manualScores.equifax);
    if (manualScores.transunion) updates.transunion_score = parseInt(manualScores.transunion);
    if (Object.keys(updates).length === 0) return;

    updates.client_id = clientId;
    updates.source = 'manual_override';
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from('client_credit_scores' as any).upsert(updates, { onConflict: 'client_id' });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Scores Saved' });
      setManualScores({ experian: '', equifax: '', transunion: '' });
      await supabase.from('client_timeline' as any).insert({
        client_id: clientId,
        event_type: 'score_update',
        event_label: 'Scores manually updated by admin',
        event_meta: updates,
      });
      fetchAll();
    }
  };

  if (loading || !client) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const completedSteps = tracker ? ACTION_LABELS.filter(a => (tracker as any)[a.key]).length : 0;
  const progressPct = Math.round((completedSteps / ACTION_LABELS.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{client.full_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            {client.membership_plan === 'active' && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ACTIVE</Badge>
            )}
            <Badge variant="outline">{(client.workflow_status || 'monitor').replace(/_/g, ' ').toUpperCase()}</Badge>
            {client.round_number > 1 && <Badge className="bg-purple-500/20 text-purple-400">ROUND {client.round_number}</Badge>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{progressPct}%</p>
          <p className="text-xs text-muted-foreground">Progress</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="overview"><User className="h-3.5 w-3.5 mr-1" />Overview</TabsTrigger>
          <TabsTrigger value="tracker"><CheckSquare className="h-3.5 w-3.5 mr-1" />Tracker</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Docs</TabsTrigger>
          <TabsTrigger value="scores"><BarChart3 className="h-3.5 w-3.5 mr-1" />Scores</TabsTrigger>
          <TabsTrigger value="notes"><MessageSquare className="h-3.5 w-3.5 mr-1" />Notes</TabsTrigger>
          <TabsTrigger value="admin"><Settings className="h-3.5 w-3.5 mr-1" />Admin</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card"><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{client.email || 'Not linked'}</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{client.phone || 'N/A'}</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium text-foreground">{client.address || 'N/A'}</p>
            </CardContent></Card>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-3 gap-4">
            {['experian', 'equifax', 'transunion'].map(bureau => (
              <Card key={bureau} className="glass-card">
                <CardContent className="pt-4 text-center">
                  <CreditCard className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground capitalize">{bureau}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {scores?.[`${bureau}_score`] || '—'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {client.next_action && (
            <Card className="glass-card border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Next Action</p>
                <p className="font-medium text-primary">{client.next_action}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Action Tracker */}
        <TabsContent value="tracker" className="mt-4">
          <Card className="glass-card">
            <CardHeader><CardTitle>Action Tracker</CardTitle><CardDescription>{completedSteps} / {ACTION_LABELS.length} steps completed</CardDescription></CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-2 mb-4">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="space-y-3">
                {ACTION_LABELS.map(action => (
                  <div key={action.key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                    <Switch
                      checked={tracker ? (tracker as any)[action.key] : false}
                      onCheckedChange={(v) => toggleAction(action.key, v)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <ClientDocumentManager clientId={clientId} />
        </TabsContent>

        {/* Scores */}
        <TabsContent value="scores" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            {['experian', 'equifax', 'transunion'].map(bureau => (
              <Card key={bureau} className="glass-card">
                <CardContent className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground capitalize">{bureau}</p>
                  <p className="text-4xl font-bold text-foreground mt-2">{scores?.[`${bureau}_score`] || '—'}</p>
                  {scores?.updated_at && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Updated {new Date(scores.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Manual Score Override</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Experian</Label>
                  <Input type="number" placeholder="e.g. 680" value={manualScores.experian} onChange={(e) => setManualScores(p => ({ ...p, experian: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Equifax</Label>
                  <Input type="number" placeholder="e.g. 700" value={manualScores.equifax} onChange={(e) => setManualScores(p => ({ ...p, equifax: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">TransUnion</Label>
                  <Input type="number" placeholder="e.g. 690" value={manualScores.transunion} onChange={(e) => setManualScores(p => ({ ...p, transunion: e.target.value }))} />
                </div>
              </div>
              <Button onClick={saveManualScores} className="mt-3" size="sm"><Save className="h-4 w-4 mr-1" />Save Scores</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes / Timeline */}
        <TabsContent value="notes" className="space-y-4 mt-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Add Note</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="Write a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} />
              <Button onClick={addNote} className="mt-2" size="sm"><Plus className="h-4 w-4 mr-1" />Add Note</Button>
            </CardContent>
          </Card>

          {notes.length > 0 && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {notes.map((note: any) => (
                  <div key={note.id} className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <p className="text-sm text-foreground">{note.note_body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(note.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {timeline.length > 0 && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">Activity Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeline.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm text-foreground">{event.event_label}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Admin Controls */}
        <TabsContent value="admin" className="mt-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Edit Client</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input value={editForm.full_name || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, full_name: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={editForm.email || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>Phone</Label><Input value={editForm.phone || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>Address</Label><Input value={editForm.address || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, address: e.target.value }))} /></div>
                <div>
                  <Label>Workflow Status</Label>
                  <Select value={editForm.workflow_status || 'monitor'} onValueChange={(v) => setEditForm((p: any) => ({ ...p, workflow_status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="ready_to_push">Ready To Push</SelectItem>
                      <SelectItem value="ready_for_605b">Ready For 605B</SelectItem>
                      <SelectItem value="needs_credit_report">Needs Credit Report</SelectItem>
                      <SelectItem value="round_2">Round 2</SelectItem>
                      <SelectItem value="cfpb_escalation">CFPB Escalation</SelectItem>
                      <SelectItem value="monitor">Monitor / Check Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={editForm.priority_level || 'normal'} onValueChange={(v) => setEditForm((p: any) => ({ ...p, priority_level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Round</Label><Input type="number" value={editForm.round_number || 1} onChange={(e) => setEditForm((p: any) => ({ ...p, round_number: parseInt(e.target.value) || 1 }))} /></div>
                <div><Label>Next Action</Label><Input value={editForm.next_action || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, next_action: e.target.value }))} /></div>
              </div>
              <div><Label>Notes Summary</Label><Textarea value={editForm.notes_summary || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, notes_summary: e.target.value }))} rows={3} /></div>
              <Button onClick={saveClientEdits}><Save className="h-4 w-4 mr-1" />Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
