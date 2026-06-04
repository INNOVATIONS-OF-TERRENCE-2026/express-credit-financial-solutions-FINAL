import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/BackButton';
import { NavigationHeader } from '@/components/NavigationHeader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRoles } from '@/hooks/useRoles';
import { 
  Users, 
  FileText, 
  Upload, 
  Eye, 
  Search, 
  Plus, 
  MessageSquare,
  ExternalLink,
  Activity,
  CreditCard,
  Pencil
} from 'lucide-react';
import { AdminClientEditor } from '@/components/AdminClientEditor';
import { ClientPaymentInfo } from '@/components/admin/ClientPaymentInfo';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Crown, Gavel } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { useClientRegistry } from '@/hooks/useClientRegistry';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  ssn_last4: string;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  membership_type?: string | null;
  membership_plan?: string | null;
  portal_status?: string | null;
  portal_account_status?: 'linked' | 'email_match' | 'needs_invite';
}

interface ClientStats {
  activeDisputes: number;
  lastActivity: string;
  totalDocuments: number;
}

export default function AdminClients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const registry = useClientRegistry();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [creditReports, setCreditReports] = useState<{ id: string; file_path: string; uploaded_at: string }[]>([]);
  const [uploadingReports, setUploadingReports] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<{
    id: string; name: string; email: string; user_id: string | null;
    alreadyPaid: boolean; currentStatus: string | null;
  }[]>([]);
  
  // New client form
  const [newClient, setNewClient] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    ssn_last4: ''
  });

  useEffect(() => {
    if (!rolesLoading && !isAdmin()) {
      navigate('/');
      return;
    }
    
    if (isAdmin()) {
      fetchClients();
    }
  }, [isAdmin, rolesLoading, navigate]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows: any[] = data || [];

      // Join membership_type from profiles by user_id
      const userIds = rows.map((r) => r.user_id).filter(Boolean);
      let tierByUser = new Map<string, string>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, membership_type')
          .in('user_id', userIds);
        (profs || []).forEach((p: any) => tierByUser.set(p.user_id, p.membership_type));
      }

      // Detect email-match availability for unlinked clients (single batched query).
      const unlinkedEmails = rows
        .filter((r) => !r.user_id && r.email)
        .map((r) => String(r.email).toLowerCase());
      const matchedEmails = new Set<string>();
      if (unlinkedEmails.length) {
        const { data: profMatches } = await supabase
          .from('profiles')
          .select('email')
          .in('email', unlinkedEmails);
        (profMatches || []).forEach((p: any) => p?.email && matchedEmails.add(String(p.email).toLowerCase()));
      }

      setClients(
        rows.map((r) => {
          const profileTier = r.user_id ? tierByUser.get(r.user_id) ?? null : null;
          const tier = r.membership_plan ?? profileTier;
          const portal_account_status: 'linked' | 'email_match' | 'needs_invite' = r.user_id
            ? 'linked'
            : (r.email && matchedEmails.has(String(r.email).toLowerCase()))
              ? 'email_match'
              : 'needs_invite';
          return { ...r, membership_type: tier, portal_account_status };
        })
      );
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('clients')
        .insert([newClient]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client created successfully',
      });

      setNewClient({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        ssn_last4: ''
      });
      setShowCreateModal(false);
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to create client',
        variant: 'destructive',
      });
    }
  };

  const getClientStats = async (clientId: string): Promise<ClientStats> => {
    try {
      // Count active disputes
      const { count: disputeCount } = await supabase
        .from('dispute_letters')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

      // Count documents
      const { count: docCount } = await supabase
        .from('document_archive')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

      // Get last activity (most recent document or dispute)
      const { data: lastDoc } = await supabase
        .from('document_archive')
        .select('created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: lastDispute } = await supabase
        .from('dispute_letters')
        .select('created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastDocDate = lastDoc?.created_at ? new Date(lastDoc.created_at) : null;
      const lastDisputeDate = lastDispute?.created_at ? new Date(lastDispute.created_at) : null;
      
      let lastActivity = 'No activity';
      if (lastDocDate && lastDisputeDate) {
        lastActivity = lastDocDate > lastDisputeDate 
          ? lastDocDate.toLocaleDateString()
          : lastDisputeDate.toLocaleDateString();
      } else if (lastDocDate) {
        lastActivity = lastDocDate.toLocaleDateString();
      } else if (lastDisputeDate) {
        lastActivity = lastDisputeDate.toLocaleDateString();
      }

      return {
        activeDisputes: disputeCount || 0,
        totalDocuments: docCount || 0,
        lastActivity
      };
    } catch (error) {
      console.error('Error getting client stats:', error);
      return {
        activeDisputes: 0,
        totalDocuments: 0,
        lastActivity: 'Unknown'
      };
    }
  };

  const openClientPortal = (client: Client) => {
    // Open admin preview route — no re-auth required
    window.open(`/admin/client-preview/${client.id}`, '_blank');
  };

  const openUploadModal = async (clientId: string) => {
    // Route to the unified Upload Reports workflow with the client preselected
    navigate(`/admin/upload-reports?clientId=${clientId}`);
  };

  const fetchClientCreditReports = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, file_path, uploaded_at')
        .eq('client_id', clientId)
        .eq('doc_type', 'credit_report')
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setCreditReports(data || []);
    } catch (error) {
      console.error('Error fetching credit reports:', error);
    }
  };

  const handleReportFiles = async (files: FileList | null) => {
    if (!files || !selectedClientId) return;
    setUploadingReports(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          toast({ title: 'Invalid file', description: 'Please upload PDF files only', variant: 'destructive' });
          continue;
        }
        const storagePath = `${selectedClientId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('credit-reports')
          .upload(storagePath, file);
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            client_id: selectedClientId,
            doc_type: 'credit_report',
            file_path: storagePath
          });
        if (insertError) throw insertError;
      }

      await fetchClientCreditReports(selectedClientId);
      toast({ title: 'Report uploaded' });
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: 'Could not upload one or more files.', variant: 'destructive' });
    } finally {
      setUploadingReports(false);
      setUploadProgress({});
    }
  };

  const viewReport = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('credit-reports')
        .createSignedUrl(filePath, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('View error:', error);
      toast({ title: 'Error', description: 'Could not generate a view link.', variant: 'destructive' });
    }
  };

  const startDispute = (clientId: string) => {
    // Navigate to dispute center with pre-selected client
    navigate(`/dispute-center?client=${clientId}`);
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm);
    const tier = client.membership_type ?? 'none';
    const matchesTier = tierFilter === 'all' || tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const tierCounts = clients.reduce<Record<string, number>>((acc, c) => {
    const t = c.membership_type ?? 'none';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const selectedClients = () => clients.filter((c) => selectedIds.has(c.id));
  const selectedUserIds = () => selectedClients().map((c) => c.user_id).filter(Boolean) as string[];

  const bulkChangeTier = async (newTier: string) => {
    const chosen = selectedClients();
    if (!chosen.length) return;
    const cids = chosen.map((c) => c.id);
    const uids = chosen.map((c) => c.user_id).filter(Boolean) as string[];
    setBulkBusy('tier');
    try {
      // Write to clients.membership_plan for ALL selected (works without auth user).
      const { error: cErr } = await supabase
        .from('clients')
        .update({ membership_plan: newTier, updated_at: new Date().toISOString() } as any)
        .in('id', cids);
      if (cErr) throw cErr;

      // Mirror to profiles.membership_type for the subset with linked auth users.
      if (uids.length) {
        const { error: pErr } = await supabase
          .from('profiles')
          .update({ membership_type: newTier } as any)
          .in('user_id', uids);
        if (pErr) throw pErr;
      }

      toast({
        title: 'Tier updated',
        description: `${cids.length} client(s) set to "${newTier}"${uids.length ? ` (${uids.length} portal profiles synced)` : ''}.`,
      });
      setSelectedIds(new Set());
      await fetchClients();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.message || 'Could not update tiers', variant: 'destructive' });
    } finally {
      setBulkBusy(null);
    }
  };

  const bulkChangeDisputeStatus = async (newStatus: string) => {
    const cids = selectedClients().map((c) => c.id);
    if (!cids.length) return;
    setBulkBusy('disputes');
    try {
      const { error, count } = await supabase
        .from('dispute_letters')
        .update({ case_status: newStatus, status_updated_at: new Date().toISOString() } as any, { count: 'exact' })
        .in('client_id', cids);
      if (error) throw error;
      toast({ title: 'Dispute status updated', description: `${count ?? 0} dispute letter(s) set to "${newStatus}".` });
      setSelectedIds(new Set());
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.message || 'Some transitions may be blocked by workflow rules', variant: 'destructive' });
    } finally {
      setBulkBusy(null);
    }
  };

  const TIERS = [
    { value: 'free', label: 'Free' },
    { value: 'vip_trial', label: 'VIP Trial' },
    { value: 'premium', label: 'Premium' },
    { value: 'expired_trial', label: 'Expired Trial' },
  ];
  const DISPUTE_STATUSES = [
    'intake_received',
    'documents_missing',
    'extracted',
    'validation_passed',
    'draft_generated',
    'needs_admin_review',
    'approved',
    'exported',
    'followup_due',
  ];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClients.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredClients.map(c => c.id)));
  };

  const openBulkPreview = async () => {
    const chosen = clients.filter(c => selectedIds.has(c.id));
    const userIds = chosen.map(c => c.user_id).filter(Boolean) as string[];
    let paidUserIds = new Set<string>();
    let statusByUser = new Map<string, string>();
    if (userIds.length) {
      const { data } = await supabase
        .from('payment_records')
        .select('user_id')
        .in('user_id', userIds)
        .eq('payment_status', 'approved');
      paidUserIds = new Set((data || []).map((r: any) => r.user_id));
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id,payment_status')
        .in('user_id', userIds);
      (profs || []).forEach((p: any) => statusByUser.set(p.user_id, p.payment_status));
    }
    setBulkPreview(chosen.map(c => ({
      id: c.id,
      name: c.full_name,
      email: c.email,
      user_id: c.user_id ?? null,
      alreadyPaid: !!c.user_id && paidUserIds.has(c.user_id),
      currentStatus: c.user_id ? (statusByUser.get(c.user_id) ?? null) : null,
    })));
    setShowBulkPreview(true);
  };

  const applyBulk = async () => {
    setBulkApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userIds = bulkPreview.map(p => p.user_id).filter(Boolean) as string[];
      const toInsert = bulkPreview
        .filter(p => p.user_id && !p.alreadyPaid)
        .map(p => ({
          user_id: p.user_id as string,
          client_id: p.id,
          payment_method: 'cash_app',
          payment_amount: 600,
          payment_status: 'approved',
          payment_note: 'Bulk admin mark paid-in-full',
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        }));
      if (toInsert.length) {
        const { error } = await supabase.from('payment_records').insert(toInsert as any);
        if (error) throw error;
      }
      if (userIds.length) {
        const { error: upErr } = await supabase
          .from('profiles')
          .update({ payment_status: 'paid' } as any)
          .in('user_id', userIds);
        if (upErr) throw upErr;
      }
      toast({ title: 'Bulk update complete', description: `${bulkPreview.length} client(s) marked Active & Paid-in-Full.` });
      setShowBulkPreview(false);
      setSelectedIds(new Set());
      fetchClients();
    } catch (err: any) {
      toast({ title: 'Bulk update failed', description: err?.message || 'Could not apply bulk changes', variant: 'destructive' });
    } finally {
      setBulkApplying(false);
    }
  };

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-foreground">All Clients</h1>
              <p className="text-muted-foreground">Manage client accounts and records</p>
            </div>
          </div>
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create New Client</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
                <DialogDescription>
                  Add a new client to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createClient} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={newClient.full_name}
                    onChange={(e) => setNewClient({...newClient, full_name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newClient.address}
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={newClient.dob}
                    onChange={(e) => setNewClient({...newClient, dob: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="ssn_last4">SSN Last 4 Digits</Label>
                  <Input
                    id="ssn_last4"
                    maxLength={4}
                    value={newClient.ssn_last4}
                    onChange={(e) => setNewClient({...newClient, ssn_last4: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Client</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-muted-foreground self-center mr-1">Tier:</span>
              {[{ value: 'all', label: 'All' }, ...TIERS, { value: 'none', label: 'No Tier' }].map((t) => {
                const count = t.value === 'all' ? clients.length : (tierCounts[t.value] || 0);
                const active = tierFilter === t.value;
                return (
                  <Button
                    key={t.value}
                    size="sm"
                    variant={active ? 'default' : 'outline'}
                    onClick={() => setTierFilter(t.value)}
                    className="h-7"
                  >
                    {t.label} <span className="ml-1 opacity-70">({count})</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Client Management ({filteredClients.length} clients)</span>
            </CardTitle>
            <CardDescription>
              View and manage all client accounts
            </CardDescription>
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3">
                <span className="text-sm"><strong>{selectedIds.size}</strong> selected</span>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" disabled={bulkBusy === 'tier'}>
                        <Crown className="h-4 w-4 mr-1" />
                        {bulkBusy === 'tier' ? 'Updating…' : 'Change Tier'}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Set membership tier</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {TIERS.map((t) => (
                        <DropdownMenuItem key={t.value} onClick={() => bulkChangeTier(t.value)}>
                          {t.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" disabled={bulkBusy === 'disputes'}>
                        <Gavel className="h-4 w-4 mr-1" />
                        {bulkBusy === 'disputes' ? 'Updating…' : 'Dispute Status'}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Set dispute case status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {DISPUTE_STATUSES.map((s) => (
                        <DropdownMenuItem key={s} onClick={() => bulkChangeDisputeStatus(s)}>
                          {s.replace(/_/g, ' ')}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button size="sm" onClick={openBulkPreview}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Mark Active & Paid-in-Full
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={filteredClients.length > 0 && selectedIds.size === filteredClients.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Paid-in-Full</TableHead>
                  <TableHead>Active Disputes</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <ClientRow 
                    key={client.id} 
                    client={client}
                    selected={selectedIds.has(client.id)}
                    onSelect={() => toggleSelect(client.id)}
                    onViewPortal={() => openClientPortal(client)}
                    onEdit={() => setEditingClientId(client.id)}
                    onUploadDocs={() => openUploadModal(client.id)}
                    onStartDispute={() => startDispute(client.id)}
                    getStats={() => getClientStats(client.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Client Editor Modal */}
        <AdminClientEditor
          clientId={editingClientId}
          open={!!editingClientId}
          onOpenChange={(open) => { if (!open) setEditingClientId(null); }}
          onSaved={() => { setEditingClientId(null); fetchClients(); }}
        />

        {/* Bulk preview dialog */}
        <Dialog open={showBulkPreview} onOpenChange={setShowBulkPreview}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Preview: Mark Active & Paid-in-Full</DialogTitle>
              <DialogDescription>
                Per-client before → after summary. Nothing is written until you click <strong>Confirm &amp; Apply</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[28rem] overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Profile Status</TableHead>
                    <TableHead>Payment Record</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkPreview.map(p => {
                    const statusBefore = p.currentStatus || (p.user_id ? 'inactive' : '—');
                    const statusAfter = p.user_id ? 'paid' : statusBefore;
                    const statusChanges = p.user_id && statusBefore !== statusAfter;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.email}</div>
                          {!p.user_id && <Badge variant="outline" className="mt-1 border-amber-500/50 text-amber-500 text-[10px]">No linked user</Badge>}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className={statusChanges ? 'line-through text-muted-foreground' : ''}>{statusBefore}</span>
                          {statusChanges && (
                            <>
                              <span className="mx-2 text-muted-foreground">→</span>
                              <span className="text-emerald-500 font-medium">paid (Active)</span>
                            </>
                          )}
                          {!statusChanges && p.user_id && <span className="ml-2 text-xs text-muted-foreground">(no change)</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {!p.user_id ? (
                            <span className="text-muted-foreground">Skipped</span>
                          ) : p.alreadyPaid ? (
                            <span><Badge variant="secondary" className="text-[10px]">Existing approved payment</Badge> <span className="text-xs text-muted-foreground ml-1">(no change)</span></span>
                          ) : (
                            <span>
                              <span className="line-through text-muted-foreground">none</span>
                              <span className="mx-2 text-muted-foreground">→</span>
                              <span className="text-emerald-500 font-medium">+ $600 approved (cash_app)</span>
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">
                {bulkPreview.filter(p => p.user_id && !p.alreadyPaid).length} new payment(s) ·{' '}
                {bulkPreview.filter(p => p.user_id && p.currentStatus !== 'paid').length} status change(s) ·{' '}
                {bulkPreview.filter(p => !p.user_id).length} skipped
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowBulkPreview(false)} disabled={bulkApplying}>Cancel</Button>
                <Button onClick={applyBulk} disabled={bulkApplying}>
                  {bulkApplying ? 'Applying…' : 'Confirm & Apply'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Documents Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Credit Report (PDF)</DialogTitle>
              <DialogDescription>
                Select one or more PDF files. Files will be stored at credit-reports/CLIENT_ID/ and recorded in Documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-upload">Choose PDF file(s)</Label>
                <input
                  id="report-upload"
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  disabled={uploadingReports}
                  onChange={(e) => handleReportFiles(e.target.files)}
                  className="w-full border rounded p-3"
                />
                {uploadingReports && (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                )}
              </div>

              <div className="border rounded p-3 max-h-64 overflow-auto">
                <p className="font-medium mb-2">Existing Reports</p>
                {creditReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reports uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {creditReports.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <span className="truncate mr-3">{r.file_path.split('/').slice(-1)[0]}</span>
                        <Button size="sm" variant="outline" onClick={() => viewReport(r.file_path)}>View</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={uploadingReports}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Separate component for client row to handle async stats loading
function ClientRow({ 
  client, 
  selected,
  onSelect,
  onViewPortal, 
  onEdit,
  onUploadDocs, 
  onStartDispute, 
  getStats 
}: {
  client: Client;
  selected: boolean;
  onSelect: () => void;
  onViewPortal: () => void;
  onEdit: () => void;
  onUploadDocs: () => void;
  onStartDispute: () => void;
  getStats: () => Promise<ClientStats>;
}) {
  const [stats, setStats] = useState<ClientStats>({
    activeDisputes: 0,
    lastActivity: 'Loading...',
    totalDocuments: 0
  });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    getStats().then((clientStats) => {
      setStats(clientStats);
      setStatsLoaded(true);
    });
  }, [getStats]);

  return (
    <TableRow>
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell className="font-medium">{client.full_name}</TableCell>
      <TableCell>{client.email}</TableCell>
      <TableCell>{client.phone}</TableCell>
      <TableCell>
        {client.membership_type ? (
          <Badge variant="outline" className="capitalize text-[10px]">
            {client.membership_type.replace(/_/g, ' ')}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {client.portal_account_status === 'linked' && (
          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Linked</Badge>
        )}
        {client.portal_account_status === 'email_match' && (
          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500">Email match</Badge>
        )}
        {client.portal_account_status === 'needs_invite' && (
          <Badge variant="outline" className="text-[10px] border-muted-foreground/40 text-muted-foreground">Needs invite</Badge>
        )}
      </TableCell>
      <TableCell><ClientPaymentInfo userId={client.user_id} /></TableCell>
      <TableCell>
        {statsLoaded ? (
          <Badge variant={stats.activeDisputes > 0 ? "default" : "secondary"}>
            {stats.activeDisputes}
          </Badge>
        ) : (
          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {statsLoaded ? stats.lastActivity : 'Loading...'}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Edit</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onViewPortal}>
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">View Portal</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onUploadDocs}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Upload Credit Report</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onStartDispute}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Start Dispute</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}