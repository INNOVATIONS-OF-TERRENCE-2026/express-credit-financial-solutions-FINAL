import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { User, ExternalLink, Upload, FileText, Settings, Search, Users, AlertTriangle, CheckCircle, Clock, Copy, RefreshCw, Shield, ArrowUpDown, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { BackButton } from '@/components/BackButton';
import { AdminDocumentUploader } from '@/components/AdminDocumentUploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRoles } from '@/hooks/useRoles';
import { useNavigate } from 'react-router-dom';

const SERVICES = [
  { value: 'full_credit_repair', label: 'Full Blown Credit Repair' },
  { value: 'chexsystems_removal', label: 'Full ChexSystems Removal' },
  { value: 'tradelines_addon', label: 'Tradelines Add-Ons' },
];

interface MergedClient {
  user_id: string;
  email: string;
  created_at: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  date_of_birth?: string;
  plan_type?: string;
  payment_status?: string;
  membership_type?: string;
  active_services?: string[];
  // from clients table
  client_id?: string;
  full_name?: string;
  phone?: string;
  membership_plan?: string;
  agreement_signed?: boolean;
  documents_uploaded?: number;
  progress_status?: number;
}

type SortKey = 'name' | 'email' | 'date' | 'status' | 'services';
type SortDir = 'asc' | 'desc';

export default function ClientPortalLinks() {
  const [clients, setClients] = useState<MergedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { toast } = useToast();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!rolesLoading && !isAdmin()) { navigate('/'); return; }
    if (isAdmin()) fetchClients();
  }, [isAdmin, rolesLoading]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesErr) throw profilesErr;

      const { data: clientsData } = await supabase.from('clients').select('*');
      const { data: agreements } = await supabase.from('client_agreements').select('user_id');
      const agreementUserIds = new Set((agreements || []).map(a => a.user_id));
      const clientsByUserId = new Map((clientsData || []).filter(c => c.user_id).map(c => [c.user_id, c]));

      const merged: MergedClient[] = (profiles || []).map((profile: any) => {
        const client = clientsByUserId.get(profile.user_id);
        const displayName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || client?.full_name || '';
        return {
          user_id: profile.user_id,
          email: profile.email,
          created_at: profile.created_at,
          first_name: profile.first_name,
          middle_name: profile.middle_name,
          last_name: profile.last_name,
          date_of_birth: profile.date_of_birth,
          plan_type: profile.plan_type,
          payment_status: profile.payment_status,
          membership_type: profile.membership_type,
          active_services: profile.active_services || [],
          client_id: client?.id,
          full_name: displayName,
          phone: client?.phone,
          membership_plan: client?.membership_plan,
          agreement_signed: agreementUserIds.has(profile.user_id),
          documents_uploaded: client?.documents_uploaded || 0,
          progress_status: client?.progress_status || 0,
        };
      });
      setClients(merged);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({ title: 'Error', description: 'Failed to load client data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (client: MergedClient) => {
    if (!client.client_id) return 'registered';
    if (!client.agreement_signed) return 'needs-agreement';
    if ((client.documents_uploaded || 0) === 0) return 'needs-docs';
    return 'portal-ready';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered': return <Badge className="gap-1 bg-emerald-600"><CheckCircle className="h-3 w-3" />Active</Badge>;
      case 'needs-agreement': return <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-500"><AlertTriangle className="h-3 w-3" />Needs Agreement</Badge>;
      case 'needs-docs': return <Badge variant="outline" className="gap-1 border-blue-500/50 text-blue-500"><Upload className="h-3 w-3" />Needs Docs</Badge>;
      case 'portal-ready': return <Badge className="gap-1 bg-emerald-600"><CheckCircle className="h-3 w-3" />Portal Ready</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const toggleService = async (client: MergedClient, serviceValue: string) => {
    const current = client.active_services || [];
    const updated = current.includes(serviceValue)
      ? current.filter(s => s !== serviceValue)
      : [...current, serviceValue];

    const { error } = await supabase
      .from('profiles')
      .update({ active_services: updated } as any)
      .eq('user_id', client.user_id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setClients(prev => prev.map(c => c.user_id === client.user_id ? { ...c, active_services: updated } : c));
      toast({ title: 'Services Updated', description: `Updated services for ${client.full_name || client.email}` });
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const filtered = useMemo(() => {
    let result = clients.filter(c =>
      (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') result = result.filter(c => getStatus(c) === statusFilter);
    if (serviceFilter !== 'all') result = result.filter(c => (c.active_services || []).includes(serviceFilter));

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = (a.full_name || '').localeCompare(b.full_name || ''); break;
        case 'email': cmp = a.email.localeCompare(b.email); break;
        case 'date': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case 'status': cmp = getStatus(a).localeCompare(getStatus(b)); break;
        case 'services': cmp = (a.active_services?.length || 0) - (b.active_services?.length || 0); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [clients, searchTerm, statusFilter, serviceFilter, sortKey, sortDir]);

  const stats = {
    total: clients.length,
    registered: clients.filter(c => !c.client_id).length,
    needsAgreement: clients.filter(c => c.client_id && !c.agreement_signed).length,
    portalReady: clients.filter(c => getStatus(c) === 'portal-ready').length,
    recentSignups: clients.filter(c => { const d = new Date(c.created_at); const ago = new Date(); ago.setDate(ago.getDate() - 7); return d > ago; }).length,
    withServices: clients.filter(c => (c.active_services?.length || 0) > 0).length,
  };

  const copyPortalLink = (client: MergedClient) => {
    const id = client.client_id || client.user_id;
    // Use admin-safe preview link (admins never need client re-auth)
    const url = `${window.location.origin}/admin/client-preview/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Admin Preview Link Copied', description: `Preview link for ${client.full_name || client.email} copied` });
  };

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Admin access required.</CardDescription>
          </CardHeader>
          <CardContent><Button onClick={() => navigate('/')} className="w-full">Return Home</Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-blue-950/30 to-black/80" />
      <div className="relative z-10">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="mb-6"><BackButton /></div>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-600 bg-clip-text text-transparent">
                Admin Client Portal Management
              </h1>
              <p className="text-muted-foreground">Live client data · Service assignment · Full sorting</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-400' },
                { label: 'New (7d)', value: stats.recentSignups, icon: Clock, color: 'text-green-400' },
                { label: 'Active', value: stats.registered, icon: CheckCircle, color: 'text-emerald-400' },
                { label: 'Needs Agreement', value: stats.needsAgreement, icon: FileText, color: 'text-orange-400' },
                { label: 'Portal Ready', value: stats.portalReady, icon: CheckCircle, color: 'text-emerald-400' },
                { label: 'Active Services', value: stats.withServices, icon: Zap, color: 'text-purple-400' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <Card key={s.label} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="pt-3 pb-2 px-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                      </div>
                      <p className="text-xl font-bold text-foreground">{s.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Tabs defaultValue="directory" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="directory" className="flex items-center gap-2"><User className="w-4 h-4" />Client Directory</TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2"><Upload className="w-4 h-4" />Document Upload</TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2"><Settings className="w-4 h-4" />Management</TabsTrigger>
              </TabsList>

              <TabsContent value="directory">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <CardTitle>Client Directory</CardTitle>
                          <CardDescription>{filtered.length} of {clients.length} accounts</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchClients}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
                      </div>
                      {/* Filters */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="registered">Active</SelectItem>
                            <SelectItem value="needs-agreement">Needs Agreement</SelectItem>
                            <SelectItem value="needs-docs">Needs Docs</SelectItem>
                            <SelectItem value="portal-ready">Portal Ready</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={serviceFilter} onValueChange={setServiceFilter}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Service" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Services</SelectItem>
                            {SERVICES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filtered.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No clients found</p>
                      </div>
                    ) : (
                      <>
                        <div className="hidden lg:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                                  <span className="flex items-center">Name <SortIcon col="name" /></span>
                                </TableHead>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('email')}>
                                  <span className="flex items-center">Email <SortIcon col="email" /></span>
                                </TableHead>
                                <TableHead>DOB</TableHead>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                                  <span className="flex items-center">Status <SortIcon col="status" /></span>
                                </TableHead>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('services')}>
                                  <span className="flex items-center">Active Services <SortIcon col="services" /></span>
                                </TableHead>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('date')}>
                                  <span className="flex items-center">Joined <SortIcon col="date" /></span>
                                </TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map(client => (
                                <TableRow key={client.user_id}>
                                  <TableCell>
                                    <p className="font-medium text-sm">{client.full_name || '—'}</p>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>
                                  <TableCell className="text-sm">
                                    {client.date_of_birth ? new Date(client.date_of_birth + 'T00:00:00').toLocaleDateString() : '—'}
                                  </TableCell>
                                  <TableCell>{getStatusBadge(getStatus(client))}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {SERVICES.map(svc => {
                                        const active = (client.active_services || []).includes(svc.value);
                                        return (
                                          <button
                                            key={svc.value}
                                            onClick={() => toggleService(client, svc.value)}
                                            className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                                              active
                                                ? 'bg-primary/20 border-primary/50 text-primary font-medium'
                                                : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30'
                                            }`}
                                          >
                                            {svc.label.replace('Full Blown ', '').replace('Full ', '')}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">{new Date(client.created_at).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="outline" onClick={() => window.open(`/admin/client-preview/${client.client_id || client.user_id}`, '_blank')}>
                                        <ExternalLink className="h-3 w-3 mr-1" />Portal
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => copyPortalLink(client)}>
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile */}
                        <div className="lg:hidden space-y-3">
                          {filtered.map(client => (
                            <Card key={client.user_id} className="border-border/50">
                              <CardContent className="pt-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{client.full_name || '—'}</p>
                                    <p className="text-xs text-muted-foreground">{client.email}</p>
                                    {client.date_of_birth && <p className="text-xs text-muted-foreground">DOB: {new Date(client.date_of_birth + 'T00:00:00').toLocaleDateString()}</p>}
                                  </div>
                                  {getStatusBadge(getStatus(client))}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {SERVICES.map(svc => {
                                    const active = (client.active_services || []).includes(svc.value);
                                    return (
                                      <button
                                        key={svc.value}
                                        onClick={() => toggleService(client, svc.value)}
                                        className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                                          active
                                            ? 'bg-primary/20 border-primary/50 text-primary font-medium'
                                            : 'bg-muted/30 border-border/50 text-muted-foreground'
                                        }`}
                                      >
                                        {svc.label.replace('Full Blown ', '').replace('Full ', '')}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(`/admin/client-preview/${client.client_id || client.user_id}`, '_blank')}>
                                    <ExternalLink className="h-3 w-3 mr-1" />Portal
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => copyPortalLink(client)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upload"><AdminDocumentUploader /></TabsContent>

              <TabsContent value="manage">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Admin Tools</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin')}>
                        <FileText className="w-4 h-4 mr-2" />Full Admin Dashboard
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/clients')}>
                        <Users className="w-4 h-4 mr-2" />Admin Client Manager
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
                    <CardHeader><CardTitle className="text-center">Quick Stats</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: 'Accounts needing onboarding', value: stats.registered },
                        { label: 'Missing agreements', value: stats.needsAgreement },
                        { label: 'Portal-ready clients', value: stats.portalReady, highlight: true },
                        { label: 'Clients with active services', value: stats.withServices },
                      ].map(s => (
                        <div key={s.label} className="flex justify-between p-2 rounded bg-muted/30">
                          <span className="text-sm text-muted-foreground">{s.label}</span>
                          <span className={`font-bold ${s.highlight ? 'text-emerald-500' : ''}`}>{s.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
