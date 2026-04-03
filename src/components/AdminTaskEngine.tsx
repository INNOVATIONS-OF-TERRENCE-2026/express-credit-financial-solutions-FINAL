import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  CheckCircle2, Circle, Plus, Calendar, AlertTriangle, Clock, Filter,
  ListChecks, Trash2, Copy, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  items: string[];
}

interface Client {
  id: string;
  full_name: string;
}

const CATEGORIES = [
  { value: 'onboarding', label: 'Onboarding', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'identity_docs', label: 'Identity Docs', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { value: 'ftc_prep', label: 'FTC Prep', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'ftc_ready', label: 'FTC Ready', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'push_through', label: 'Push Through', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  { value: 'bureau_followup', label: 'Bureau Follow-Up', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { value: 'client_response', label: 'Client Response', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { value: 'payment_followup', label: 'Payment Follow-Up', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'finalization', label: 'Finalization', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  { value: 'general', label: 'General', color: 'bg-muted text-muted-foreground' },
];

const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'normal', label: 'Normal', color: 'text-foreground' },
  { value: 'low', label: 'Low', color: 'text-muted-foreground' },
];

export function AdminTaskEngine() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'general', priority: 'normal', client_id: '', due_date: '' });

  const fetchAll = useCallback(async () => {
    try {
      const [tasksRes, templatesRes, clientsRes] = await Promise.all([
        supabase.from('admin_tasks').select('*').order('sort_order').order('created_at', { ascending: false }),
        supabase.from('task_templates').select('*').order('name'),
        supabase.from('clients').select('id, full_name').order('full_name'),
      ]);
      setTasks((tasksRes.data || []) as Task[]);
      setTemplates((templatesRes.data || []).map((t: any) => ({ ...t, items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items })) as Template[]);
      setClients((clientsRes.data || []) as Client[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    const { error } = await supabase.from('admin_tasks').insert({
      title: newTask.title,
      description: newTask.description || null,
      category: newTask.category,
      priority: newTask.priority,
      client_id: newTask.client_id || null,
      due_date: newTask.due_date || null,
      created_by: user?.id,
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Task created' });
    setNewTask({ title: '', description: '', category: 'general', priority: 'normal', client_id: '', due_date: '' });
    setShowAddTask(false);
    fetchAll();
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase.from('admin_tasks').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      completed_by: newStatus === 'completed' ? user?.id : null,
    } as any).eq('id', task.id);
    fetchAll();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('admin_tasks').delete().eq('id', id);
    fetchAll();
  };

  const applyTemplate = async (template: Template, clientId?: string) => {
    const inserts = template.items.map((item: string, idx: number) => ({
      title: item,
      category: template.category,
      priority: 'normal',
      client_id: clientId || null,
      sort_order: idx,
      created_by: user?.id,
    }));
    const { error } = await supabase.from('admin_tasks').insert(inserts as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Template applied', description: `${template.items.length} tasks created` });
    fetchAll();
  };

  const filteredTasks = tasks.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterClient !== 'all' && t.client_id !== filterClient) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = filteredTasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()).length;

  const getCategoryStyle = (cat: string) => CATEGORIES.find(c => c.value === cat)?.color || 'bg-muted text-muted-foreground';
  const getPriorityColor = (p: string) => PRIORITIES.find(pr => pr.value === p)?.color || '';
  const getClientName = (id: string | null) => id ? clients.find(c => c.id === id)?.full_name || 'Unknown' : 'General';

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="glass-card"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-foreground">{totalTasks}</p><p className="text-xs text-muted-foreground">Total Tasks</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-green-500">{completedTasks}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-amber-500">{totalTasks - completedTasks}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4 pb-3 text-center"><p className={cn("text-2xl font-bold", overdueTasks > 0 ? 'text-red-500' : 'text-muted-foreground')}>{overdueTasks}</p><p className="text-xs text-muted-foreground">Overdue</p></CardContent></Card>
        <Card className="glass-card col-span-2 lg:col-span-1"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-primary">{completionPct}%</p><Progress value={completionPct} className="mt-1 h-2" /><p className="text-xs text-muted-foreground mt-1">Completion</p></CardContent></Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Clients" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddTask(true)}><Plus className="h-4 w-4 mr-1" />Add Task</Button>

        {/* Template dropdown */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"><Copy className="h-4 w-4 mr-1" />Templates</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Apply Task Template</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {templates.map(t => (
                <Card key={t.id} className="glass-card-hover cursor-pointer" onClick={() => { applyTemplate(t, filterClient !== 'all' ? filterClient : undefined); }}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.items.length} tasks • {t.category}</p>
                      </div>
                      <Badge className={getCategoryStyle(t.category)} variant="outline">{t.category}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {t.items.slice(0, 3).map((item, i) => <p key={i}>• {item}</p>)}
                      {t.items.length > 3 && <p>+{t.items.length - 3} more...</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <Card className="glass-card border-primary/30">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Title *</Label><Input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title" /></div>
              <div><Label>Client</Label>
                <Select value={newTask.client_id} onValueChange={v => setNewTask(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="No client (general)" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Category</Label>
                <Select value={newTask.category} onValueChange={v => setNewTask(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} /></div>
              <div><Label>Description</Label><Input value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addTask}>Create Task</Button>
              <Button variant="ghost" onClick={() => setShowAddTask(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <Card className="glass-card"><CardContent className="py-8 text-center"><ListChecks className="h-12 w-12 mx-auto mb-2 text-muted-foreground" /><p className="text-muted-foreground">No tasks found. Create one or apply a template.</p></CardContent></Card>
        ) : (
          filteredTasks.map(task => {
            const isOverdue = task.status !== 'completed' && task.due_date && new Date(task.due_date) < new Date();
            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border bg-card transition-all hover:shadow-sm',
                  task.status === 'completed' && 'opacity-60',
                  isOverdue && 'border-red-500/30 bg-red-500/5'
                )}
              >
                <button onClick={() => toggleTask(task)} className="shrink-0">
                  {task.status === 'completed'
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <Circle className={cn("h-5 w-5", isOverdue ? 'text-red-500' : 'text-muted-foreground')} />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", task.status === 'completed' && 'line-through text-muted-foreground', getPriorityColor(task.priority))}>
                    {task.priority === 'urgent' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge className={cn("text-[10px]", getCategoryStyle(task.category))} variant="outline">{task.category}</Badge>
                    {task.client_id && <Badge variant="secondary" className="text-[10px]">{getClientName(task.client_id)}</Badge>}
                    {task.due_date && (
                      <span className={cn("text-[10px] flex items-center gap-0.5", isOverdue ? 'text-red-500 font-semibold' : 'text-muted-foreground')}>
                        <Calendar className="h-3 w-3" />{new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => deleteTask(task.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
