import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, CheckCircle2, Clock, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reminder {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  reminder_type: string;
  due_at: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface Client {
  id: string;
  full_name: string;
}

const REMINDER_TYPES = [
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'document_needed', label: 'Document Needed' },
  { value: 'payment', label: 'Payment' },
  { value: 'bureau_check', label: 'Bureau Check' },
  { value: 'client_call', label: 'Client Call' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'general', label: 'General' },
];

export function AdminReminders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', description: '', reminder_type: 'general', client_id: '', due_at: '' });

  const fetchData = useCallback(async () => {
    try {
      const [remRes, clientRes] = await Promise.all([
        supabase.from('admin_reminders').select('*').order('due_at'),
        supabase.from('clients').select('id, full_name').order('full_name'),
      ]);
      setReminders((remRes.data || []) as Reminder[]);
      setClients((clientRes.data || []) as Client[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.due_at) {
      toast({ title: 'Required', description: 'Title and due date are required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('admin_reminders').insert({
      title: newReminder.title,
      description: newReminder.description || null,
      reminder_type: newReminder.reminder_type,
      client_id: newReminder.client_id || null,
      due_at: new Date(newReminder.due_at).toISOString(),
      created_by: user?.id,
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Reminder created' });
    setNewReminder({ title: '', description: '', reminder_type: 'general', client_id: '', due_at: '' });
    setShowAdd(false);
    fetchData();
  };

  const completeReminder = async (id: string) => {
    await supabase.from('admin_reminders').update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    } as any).eq('id', id);
    fetchData();
  };

  const deleteReminder = async (id: string) => {
    await supabase.from('admin_reminders').delete().eq('id', id);
    fetchData();
  };

  const getClientName = (id: string | null) => id ? clients.find(c => c.id === id)?.full_name || 'Unknown' : '';

  const filtered = reminders.filter(r => {
    if (!showCompleted && r.is_completed) return false;
    if (filterType !== 'all' && r.reminder_type !== filterType) return false;
    return true;
  });

  const now = new Date();
  const overdue = filtered.filter(r => !r.is_completed && new Date(r.due_at) < now);
  const upcoming = filtered.filter(r => !r.is_completed && new Date(r.due_at) >= now);
  const completed = filtered.filter(r => r.is_completed);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const ReminderCard = ({ reminder, isOverdue }: { reminder: Reminder; isOverdue?: boolean }) => (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border bg-card transition-all",
      reminder.is_completed && 'opacity-50',
      isOverdue && 'border-red-500/30 bg-red-500/5',
    )}>
      <Bell className={cn("h-4 w-4 shrink-0", isOverdue ? 'text-red-500' : reminder.is_completed ? 'text-green-500' : 'text-amber-500')} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", reminder.is_completed && 'line-through text-muted-foreground')}>{reminder.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <Badge variant="outline" className="text-[10px]">{reminder.reminder_type}</Badge>
          {reminder.client_id && <Badge variant="secondary" className="text-[10px]">{getClientName(reminder.client_id)}</Badge>}
          <span className={cn("text-[10px] flex items-center gap-0.5", isOverdue ? 'text-red-500 font-semibold' : 'text-muted-foreground')}>
            <Calendar className="h-3 w-3" />
            {new Date(reminder.due_at).toLocaleString()}
          </span>
        </div>
        {reminder.description && <p className="text-xs text-muted-foreground mt-1">{reminder.description}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!reminder.is_completed && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => completeReminder(reminder.id)}>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteReminder(reminder.id)}>
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={cn("glass-card", overdue.length > 0 && 'border-red-500/30')}><CardContent className="pt-4 pb-3 text-center"><p className={cn("text-2xl font-bold", overdue.length > 0 ? 'text-red-500' : 'text-foreground')}>{overdue.length}</p><p className="text-xs text-muted-foreground">Overdue</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-amber-500">{upcoming.length}</p><p className="text-xs text-muted-foreground">Upcoming</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-green-500">{completed.length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {REMINDER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={showCompleted ? 'default' : 'outline'} size="sm" onClick={() => setShowCompleted(!showCompleted)}>
          {showCompleted ? 'Hide' : 'Show'} Completed
        </Button>
        <Button onClick={() => setShowAdd(true)} className="ml-auto"><Plus className="h-4 w-4 mr-1" />New Reminder</Button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <Card className="glass-card border-primary/30">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Title *</Label><Input value={newReminder.title} onChange={e => setNewReminder(p => ({ ...p, title: e.target.value }))} placeholder="Reminder title" /></div>
              <div><Label>Due Date/Time *</Label><Input type="datetime-local" value={newReminder.due_at} onChange={e => setNewReminder(p => ({ ...p, due_at: e.target.value }))} /></div>
              <div><Label>Type</Label>
                <Select value={newReminder.reminder_type} onValueChange={v => setNewReminder(p => ({ ...p, reminder_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REMINDER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Client</Label>
                <Select value={newReminder.client_id} onValueChange={v => setNewReminder(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Input value={newReminder.description} onChange={e => setNewReminder(p => ({ ...p, description: e.target.value }))} placeholder="Optional notes" /></div>
            <div className="flex gap-2">
              <Button onClick={addReminder}>Create Reminder</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-red-500 flex items-center gap-1"><Clock className="h-4 w-4" />Overdue ({overdue.length})</h3>
          {overdue.map(r => <ReminderCard key={r.id} reminder={r} isOverdue />)}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1"><Calendar className="h-4 w-4" />Upcoming ({upcoming.length})</h3>
          {upcoming.map(r => <ReminderCard key={r.id} reminder={r} />)}
        </div>
      )}

      {/* Completed */}
      {showCompleted && completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-green-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />Completed ({completed.length})</h3>
          {completed.map(r => <ReminderCard key={r.id} reminder={r} />)}
        </div>
      )}

      {overdue.length === 0 && upcoming.length === 0 && (!showCompleted || completed.length === 0) && (
        <Card className="glass-card"><CardContent className="py-8 text-center"><Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground" /><p className="text-muted-foreground">No reminders yet. Create one to stay on track.</p></CardContent></Card>
      )}
    </div>
  );
}
