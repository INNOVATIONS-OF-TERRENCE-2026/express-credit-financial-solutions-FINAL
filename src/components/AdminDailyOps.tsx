import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle2, Circle, AlertTriangle, Clock, Flame, TrendingUp,
  Calendar, Target, Zap, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  client_id: string | null;
  title: string;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
}

interface Reminder {
  id: string;
  client_id: string | null;
  title: string;
  due_at: string;
  is_completed: boolean;
  reminder_type: string;
}

interface Client {
  id: string;
  full_name: string;
}

export function AdminDailyOps() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, remindersRes, clientsRes] = await Promise.all([
        supabase.from('admin_tasks').select('*').order('sort_order').order('created_at', { ascending: false }),
        supabase.from('admin_reminders').select('*').eq('is_completed', false).order('due_at'),
        supabase.from('clients').select('id, full_name'),
      ]);
      setTasks((tasksRes.data || []) as Task[]);
      setReminders((remindersRes.data || []) as Reminder[]);
      setClients((clientsRes.data || []) as Client[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase.from('admin_tasks').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    } as any).eq('id', task.id);
    fetchData();
  };

  const getClientName = (id: string | null) => id ? clients.find(c => c.id === id)?.full_name || 'Unknown' : '';

  // Today's tasks: due today, overdue, or urgent priority
  const todaysTasks = tasks.filter(t => {
    if (t.status === 'completed' && t.completed_at && t.completed_at.startsWith(today)) return true;
    if (t.status !== 'completed') {
      if (t.due_date && t.due_date <= today) return true;
      if (t.priority === 'urgent') return true;
      if (!t.due_date && t.priority === 'high') return true;
    }
    return false;
  });

  const todayCompleted = todaysTasks.filter(t => t.status === 'completed').length;
  const todayTotal = todaysTasks.length;
  const todayPct = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 100;

  const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.due_date && t.due_date < today);
  const urgentTasks = tasks.filter(t => t.status !== 'completed' && t.priority === 'urgent');
  const dueReminders = reminders.filter(r => new Date(r.due_at) <= new Date());
  const upcomingReminders = reminders.filter(r => {
    const d = new Date(r.due_at);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    return d > new Date() && d <= tomorrow;
  });

  // All pending tasks
  const allPending = tasks.filter(t => t.status !== 'completed').length;
  const allCompleted = tasks.filter(t => t.status === 'completed').length;
  const globalPct = tasks.length > 0 ? Math.round((allCompleted / tasks.length) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn("glass-card border-2", todayPct === 100 ? 'border-green-500/30' : todayPct > 50 ? 'border-amber-500/30' : 'border-red-500/30')}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Progress</p>
              <Target className={cn("h-5 w-5", todayPct === 100 ? 'text-green-500' : 'text-amber-500')} />
            </div>
            <p className="text-4xl font-bold text-foreground">{todayPct}%</p>
            <Progress value={todayPct} className="mt-2 h-2.5" />
            <p className="text-xs text-muted-foreground mt-1">{todayCompleted}/{todayTotal} tasks done today</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</p>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-4xl font-bold text-foreground">{allPending}</p>
            <p className="text-xs text-muted-foreground mt-1">{allCompleted} completed overall</p>
          </CardContent>
        </Card>

        <Card className={cn("glass-card", overdueTasks.length > 0 && 'border-red-500/30')}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue</p>
              <AlertTriangle className={cn("h-5 w-5", overdueTasks.length > 0 ? 'text-red-500' : 'text-muted-foreground')} />
            </div>
            <p className={cn("text-4xl font-bold", overdueTasks.length > 0 ? 'text-red-500' : 'text-foreground')}>{overdueTasks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Need immediate action</p>
          </CardContent>
        </Card>

        <Card className={cn("glass-card", dueReminders.length > 0 && 'border-amber-500/30')}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Reminders</p>
              <Flame className={cn("h-5 w-5", dueReminders.length > 0 ? 'text-amber-500' : 'text-muted-foreground')} />
            </div>
            <p className={cn("text-4xl font-bold", dueReminders.length > 0 ? 'text-amber-500' : 'text-foreground')}>{dueReminders.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{upcomingReminders.length} upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Global Progress */}
      <Card className="glass-card">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">Overall Task Completion</span>
            <span className="text-sm font-bold text-primary">{globalPct}%</span>
          </div>
          <Progress value={globalPct} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{allCompleted} completed</span>
            <span>{allPending} remaining</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent & Overdue */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              Urgent & Overdue
              {(urgentTasks.length + overdueTasks.length) > 0 && (
                <Badge variant="destructive" className="ml-auto">{urgentTasks.length + overdueTasks.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {[...overdueTasks, ...urgentTasks.filter(t => !overdueTasks.includes(t))].length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">✅ No urgent or overdue tasks!</p>
            ) : (
              [...overdueTasks, ...urgentTasks.filter(t => !overdueTasks.includes(t))].map(task => (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5">
                  <button onClick={() => toggleTask(task)} className="shrink-0">
                    <Circle className="h-4 w-4 text-red-500" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.client_id && <span className="text-[10px] text-muted-foreground">{getClientName(task.client_id)}</span>}
                      {task.due_date && <span className="text-[10px] text-red-500 font-semibold">{task.due_date}</span>}
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-[10px] shrink-0">
                    {task.due_date && task.due_date < today ? 'OVERDUE' : 'URGENT'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Today's Task List */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Today's Tasks
              <Badge variant="outline" className="ml-auto">{todayCompleted}/{todayTotal}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {todaysTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks for today. Add some!</p>
            ) : (
              todaysTasks.map(task => (
                <div key={task.id} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg border transition-all", task.status === 'completed' ? 'opacity-50 bg-green-500/5 border-green-500/20' : 'border-border hover:bg-accent/5')}>
                  <button onClick={() => toggleTask(task)} className="shrink-0">
                    {task.status === 'completed'
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <Circle className="h-4 w-4 text-muted-foreground" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", task.status === 'completed' && 'line-through text-muted-foreground')}>{task.title}</p>
                    {task.client_id && <span className="text-[10px] text-muted-foreground">{getClientName(task.client_id)}</span>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Due Reminders */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Reminders Needing Action
              {dueReminders.length > 0 && <Badge variant="destructive" className="ml-auto animate-pulse">{dueReminders.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dueReminders.length === 0 && upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No reminders due. You're on track!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[...dueReminders, ...upcomingReminders].map(r => (
                  <div key={r.id} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg border", new Date(r.due_at) <= new Date() ? 'border-amber-500/30 bg-amber-500/5' : 'border-border')}>
                    <Clock className={cn("h-4 w-4 shrink-0", new Date(r.due_at) <= new Date() ? 'text-amber-500' : 'text-muted-foreground')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <div className="flex items-center gap-2">
                        {r.client_id && <span className="text-[10px] text-muted-foreground">{getClientName(r.client_id)}</span>}
                        <span className="text-[10px] text-muted-foreground">{new Date(r.due_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{r.reminder_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
