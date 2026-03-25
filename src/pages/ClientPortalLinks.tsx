import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, ExternalLink, Upload, FileText, Settings, Search, Users, AlertTriangle, CheckCircle, Clock, Copy, RefreshCw, Shield } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { BackButton } from '@/components/BackButton';
import { AdminDocumentUploader } from '@/components/AdminDocumentUploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRoles } from '@/hooks/useRoles';
import { useNavigate } from 'react-router-dom';

interface MergedClient {
  user_id: string;
  email: string;
  created_at: string;
  plan_type?: string;
  payment_status?: string;
  membership_type?: string;
  // from clients table
  client_id?: string;
  full_name?: string;
  phone?: string;
  membership_plan?: string;
  agreement_signed?: boolean;
  documents_uploaded?: number;
  progress_status?: number;
}

export default function ClientPortalLinks() {
  const [clients, setClients] = useState<MergedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!rolesLoading && !isAdmin()) {
      navigate('/');
      return;
    }
    if (isAdmin()) fetchClients();
  }, [isAdmin, rolesLoading]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Fetch all profiles (source of truth for accounts)
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesErr) throw profilesErr;

      // Fetch all clients records
      const { data: clientsData, error: clientsErr } = await supabase
        .from('clients')
        .select('*');

      if (clientsErr) throw clientsErr;

      // Fetch agreement status
      const { data: agreements } = await supabase
        .from('client_agreements')
        .select('user_id');

      const agreementUserIds = new Set((agreements || []).map(a => a.user_id));

      // Merge profiles with clients
      const clientsByUserId = new Map(
        (clientsData || []).filter(c => c.user_id).map(c => [c.user_id, c])
      );

      const merged: MergedClient[] = (profiles || []).map(profile => {
        const client = clientsByUserId.get(profile.user_id);
        return {
          user_id: profile.user_id,
          email: profile.email,
          created_at: profile.created_at,
          plan_type: profile.plan_type,
          payment_status: profile.payment_status,
          membership_type: profile.membership_type,
          client_id: client?.id,
          full_name: client?.full_name,
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
      case 'registered':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Registered Only</Badge>;
      case 'needs-agreement':
        return <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-500"><AlertTriangle className="h-3 w-3" />Needs Agreement</Badge>;
      case 'needs-docs':
        return <Badge variant="outline" className="gap-1 border-blue-500/50 text-blue-500"><Upload className="h-3 w-3" />Needs Documents</Badge>;
      case 'portal-ready':
        return <Badge className="gap-1 bg-emerald-600"><CheckCircle className="h-3 w-3" />Portal Ready</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const filtered = clients.filter(c =>
    (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: clients.length,
    registered: clients.filter(c => !c.client_id).length,
    needsAgreement: clients.filter(c => c.client_id && !c.agreement_signed).length,
    portalReady: clients.filter(c => getStatus(c) === 'portal-ready').length,
    recentSignups: clients.filter(c => {
      const d = new Date(c.created_at);
      const ago = new Date(); ago.setDate(ago.getDate() - 7);
      return d > ago;
    }).length,
  };

  const copyPortalLink = (client: MergedClient) => {
    const slug = client.user_id;
    const url = `${window.location.origin}/client/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied', description: `Portal link for ${client.full_name || client.email} copied` });
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-blue-950/30 to-black/80"></div>
      <div className="relative z-10">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="mb-6"><BackButton /></div>

          <div className="max-w-7xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-600 bg-clip-text text-transparent">
                Admin Client Portal Management
              </h1>
              <p className="text-muted-foreground">Live client data synced from all accounts</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Accounts', value: stats.total, icon: Users, color: 'text-blue-400' },
                { label: 'New (7 days)', value: stats.recentSignups, icon: Clock, color: 'text-green-400' },
                { label: 'Registered Only', value: stats.registered, icon: AlertTriangle, color: 'text-amber-400' },
                { label: 'Needs Agreement', value: stats.needsAgreement, icon: FileText, color: 'text-orange-400' },
                { label: 'Portal Ready', value: stats.portalReady, icon: CheckCircle, color: 'text-emerald-400' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <Card key={s.label} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-4 w-4 ${s.color}`} />
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="flex items-center gap-2"><User className="w-4 h-4" />All Clients</TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2"><Upload className="w-4 h-4" />Document Upload</TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2"><Settings className="w-4 h-4" />Management</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle>Client Directory</CardTitle>
                        <CardDescription>{filtered.length} accounts found</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                        </div>
                        <Button variant="outline" size="icon" onClick={fetchClients}><RefreshCw className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filtered.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No clients found</p>
                        <p className="text-sm">New signups will appear here automatically</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop table */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name / Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map(client => (
                                <TableRow key={client.user_id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{client.full_name || '—'}</p>
                                      <p className="text-xs text-muted-foreground">{client.email}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(getStatus(client))}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{client.membership_plan || client.plan_type || 'None'}</Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">{new Date(client.created_at).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="outline" onClick={() => window.open(`/client/${client.user_id}`, '_blank')}>
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
                        {/* Mobile cards */}
                        <div className="md:hidden space-y-3">
                          {filtered.map(client => (
                            <Card key={client.user_id} className="border-border/50">
                              <CardContent className="pt-4 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{client.full_name || '—'}</p>
                                    <p className="text-xs text-muted-foreground">{client.email}</p>
                                  </div>
                                  {getStatusBadge(getStatus(client))}
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(`/client/${client.user_id}`, '_blank')}>
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

              <TabsContent value="upload">
                <AdminDocumentUploader />
              </TabsContent>

              <TabsContent value="manage">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Admin Tools</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin')}>
                        <FileText className="w-4 h-4 mr-2" />Full Admin Dashboard
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/clients')}>
                        <Users className="w-4 h-4 mr-2" />Admin Client Manager
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/tools')}>
                        <Settings className="w-4 h-4 mr-2" />Admin Tools
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-center">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between p-2 rounded bg-muted/30">
                        <span className="text-sm text-muted-foreground">Accounts needing onboarding</span>
                        <span className="font-bold">{stats.registered}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-muted/30">
                        <span className="text-sm text-muted-foreground">Missing agreements</span>
                        <span className="font-bold">{stats.needsAgreement}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-muted/30">
                        <span className="text-sm text-muted-foreground">Portal-ready clients</span>
                        <span className="font-bold text-emerald-500">{stats.portalReady}</span>
                      </div>
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
