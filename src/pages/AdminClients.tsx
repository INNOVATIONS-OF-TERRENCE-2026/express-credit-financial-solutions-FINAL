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
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [creditReports, setCreditReports] = useState<{ id: string; file_path: string; uploaded_at: string }[]>([]);
  const [uploadingReports, setUploadingReports] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  
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
      setClients(data || []);
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
        .from('identity_docs')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

      // Get last activity (most recent document or dispute)
      const { data: lastDoc } = await supabase
        .from('identity_docs')
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

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

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
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
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
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
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
  onViewPortal, 
  onEdit,
  onUploadDocs, 
  onStartDispute, 
  getStats 
}: {
  client: Client;
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
      <TableCell className="font-medium">{client.full_name}</TableCell>
      <TableCell>{client.email}</TableCell>
      <TableCell>{client.phone}</TableCell>
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