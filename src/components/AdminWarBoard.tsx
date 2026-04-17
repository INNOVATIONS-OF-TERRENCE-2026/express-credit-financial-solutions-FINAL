import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Users, Crown, CheckCircle, Rocket, FileText, AlertTriangle,
  RotateCcw, Shield, Eye, Search, ChevronRight, Clock
} from 'lucide-react';

interface ClientRecord {
  id: string;
  full_name: string;
  email: string | null;
  membership_plan: string | null;
  workflow_status: string | null;
  round_number: number | null;
  priority_level: string | null;
  next_action: string | null;
  notes_summary: string | null;
  updated_at: string;
  user_id: string | null;
}

const WORKFLOW_STATUSES = [
  { key: 'completed', label: 'COMPLETED', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { key: 'ready_to_push', label: 'READY TO PUSH', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { key: 'ready_for_605b', label: 'READY FOR 605B', icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { key: 'needs_credit_report', label: 'NEEDS CREDIT REPORT', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { key: 'round_2', label: 'ROUND 2', icon: RotateCcw, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { key: 'cfpb_escalation', label: 'CFPB ESCALATION', icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { key: 'monitor', label: 'MONITOR / CHECK STATUS', icon: Eye, color: 'text-muted-foreground', bg: 'bg-muted/50 border-border' },
];

interface AdminWarBoardProps {
  onOpenClient?: (clientId: string) => void;
}

export function AdminWarBoard({ onOpenClient }: AdminWarBoardProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'priority'>('name');

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('full_name');
    if (error) {
      console.error('Error fetching clients:', error);
      toast({ title: 'Error', description: 'Failed to load clients', variant: 'destructive' });
    } else {
      setClients((data || []) as ClientRecord[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel('warboard-clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchClients())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchClients]);

  const updateClientStatus = async (clientId: string, newStatus: string) => {
    const { error } = await supabase.from('clients').update({
      workflow_status: newStatus,
      round_number: newStatus === 'round_2' ? 2 : undefined,
    } as any).eq('id', clientId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: 'Client status changed' });
      // Insert timeline event
      await supabase.from('client_timeline' as any).insert({
        client_id: clientId,
        event_type: 'status_change',
        event_label: `Status changed to ${newStatus}`,
        event_meta: { new_status: newStatus },
      });
    }
  };

  const filteredClients = clients
    .filter(c => c.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(c => statusFilter === 'all' || c.workflow_status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
      if (sortBy === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
      return (priorityOrder[a.priority_level || 'normal'] || 2) - (priorityOrder[b.priority_level || 'normal'] || 2);
    });

  // Stats
  const statusCounts = WORKFLOW_STATUSES.map(s => ({
    ...s,
    count: clients.filter(c => c.workflow_status === s.key).length,
  }));
  const totalActive = clients.filter(c => c.membership_plan === 'active').length;

  const statCards = [
    { label: 'Total Clients', value: clients.length, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Active Memberships', value: totalActive, icon: Crown, color: 'text-amber-400 bg-amber-500/10' },
    ...statusCounts.map(s => ({
      label: s.label,
      value: s.count,
      icon: s.icon,
      color: `${s.color} ${s.bg.split(' ')[0]}`,
      filterKey: s.key,
    })),
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          const filterKey = (card as any).filterKey;
          return (
            <button
              key={card.label}
              onClick={() => filterKey ? setStatusFilter(statusFilter === filterKey ? 'all' : filterKey) : setStatusFilter('all')}
              className={`text-left rounded-xl border p-3 transition-all hover:shadow-md ${
                statusFilter === filterKey ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : 'border-border bg-card/60 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`rounded-lg p-1.5 ${card.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5 truncate">{card.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {WORKFLOW_STATUSES.map(s => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="updated">Recent First</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchClients} size="sm">Refresh</Button>
      </div>

      {/* Pipeline Columns */}
      {statusFilter === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {WORKFLOW_STATUSES.map(status => {
            const statusClients = filteredClients.filter(c => c.workflow_status === status.key);
            const Icon = status.icon;
            return (
              <div key={status.key} className={`rounded-xl border ${status.bg} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-4 w-4 ${status.color}`} />
                  <h3 className="font-semibold text-sm text-foreground">{status.label}</h3>
                  <Badge variant="secondary" className="ml-auto text-xs">{statusClients.length}</Badge>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {statusClients.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No clients</p>
                  ) : (
                    statusClients.map(client => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onStatusChange={updateClientStatus}
                        onOpen={() => onOpenClient?.(client.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredClients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onStatusChange={updateClientStatus}
              onOpen={() => onOpenClient?.(client.id)}
            />
          ))}
          {filteredClients.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">No clients match your filters</p>
          )}
        </div>
      )}
    </div>
  );
}

function ClientCard({ client, onStatusChange, onOpen }: { client: ClientRecord; onStatusChange: (id: string, status: string) => void; onOpen: () => void }) {
  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    normal: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className="glass-card-hover border-border/50 bg-card/70 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{client.full_name}</p>
            {client.email && <p className="text-xs text-muted-foreground truncate">{client.email}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {client.membership_plan === 'active' && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5">ACTIVE</Badge>
            )}
            <Badge className={`text-[10px] px-1.5 ${priorityColors[client.priority_level || 'normal']}`}>
              {(client.priority_level || 'normal').toUpperCase()}
            </Badge>
          </div>
        </div>

        {client.next_action && (
          <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {client.next_action}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(client.updated_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Select
              value={client.workflow_status || 'monitor'}
              onValueChange={(v) => onStatusChange(client.id, v)}
            >
              <SelectTrigger className="h-6 text-[10px] w-[100px] border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKFLOW_STATUSES.map(s => (
                  <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onOpen}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
