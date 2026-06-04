import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminFileUploader } from '@/components/AdminFileUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRoles } from '@/hooks/useRoles';
import { NavigationHeader } from '@/components/NavigationHeader';
import { BackButton } from '@/components/BackButton';
import { 
  Users, 
  FileText, 
  Upload, 
  Search, 
  Eye, 
  Download, 
  Trash2,
  Plus,
  ExternalLink,
  Brain,
  CreditCard
} from 'lucide-react';

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

interface Document {
  id: string;
  client_id: string;
  doc_type: string;
  uploaded_file_url: string;
  created_at: string;
}

interface CreditReport {
  id: string;
  client_id: string;
  bureau: string;
  uploaded_file_url: string;
  notes?: string;
  fico_score: number;
  created_at: string;
}

interface DisputeLetter {
  id: string;
  client_id: string;
  creditor_name: string;
  account_number: string;
  issue_type: string;
  generated_letter: string;
  uploaded_file_url?: string;
  created_at: string;
}

export function AdminCRMFixedPanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [creditReports, setCreditReports] = useState<CreditReport[]>([]);
  const [disputeLetters, setDisputeLetters] = useState<DisputeLetter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useRoles();

  useEffect(() => {
    if (isAdmin()) {
      fetchClients();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedClient) {
      fetchClientDocuments();
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('full_name');

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

  const fetchClientDocuments = async () => {
    if (!selectedClient) return;

    try {
      // Fetch identity documents
      const { data: docsData, error: docsError } = await supabase
        .from('document_archive')
        .select('*')
        .eq('client_id', selectedClient)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docsData || []);

      // Fetch credit reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('credit_reports')
        .select('*')
        .eq('client_id', selectedClient)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setCreditReports(reportsData || []);

      // Fetch dispute letters
      const { data: lettersData, error: lettersError } = await supabase
        .from('dispute_letters')
        .select('*')
        .eq('client_id', selectedClient)
        .order('created_at', { ascending: false });

      if (lettersError) throw lettersError;
      setDisputeLetters(lettersData || []);

    } catch (error) {
      console.error('Error fetching client documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client documents',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async (docId: string, type: 'identity' | 'credit' | 'dispute') => {
    try {
      let error;
      
      if (type === 'identity') {
        ({ error } = await supabase.from('document_archive').delete().eq('id', docId));
      } else if (type === 'credit') {
        ({ error } = await supabase.from('credit_reports').delete().eq('id', docId));
      } else {
        ({ error } = await supabase.from('dispute_letters').delete().eq('id', docId));
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      fetchClientDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const generateAIPreview = async (documentUrl: string, documentType: string) => {
    try {
      // This would call an edge function to analyze the document with AI
      toast({
        title: 'AI Analysis',
        description: 'AI preview functionality will be implemented here',
      });
    } catch (error) {
      console.error('Error generating AI preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI preview',
        variant: 'destructive',
      });
    }
  };

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const selectedClientData = clients.find(c => c.id === selectedClient);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading admin interface...</p>
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
                You don't have permission to access the admin CRM.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = '/'} className="w-full">
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
              <h1 className="text-3xl font-bold text-foreground">Admin CRM</h1>
              <p className="text-muted-foreground">Client Relationship Management System</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clients">All Clients</TabsTrigger>
            <TabsTrigger value="documents">Document Manager</TabsTrigger>
            <TabsTrigger value="disputes">Dispute Center</TabsTrigger>
            <TabsTrigger value="automation">Document Automation</TabsTrigger>
          </TabsList>

          {/* All Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Client Management ({filteredClients.length} clients)</span>
                    </CardTitle>
                    <CardDescription>
                      View and manage all client accounts
                    </CardDescription>
                  </div>
                  <Button onClick={() => window.open('/admin/clients', '_blank')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Client
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.full_name}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.phone}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(client.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  window.open(`/admin/client-preview/${client.id}`, '_blank');
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Portal
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedClient(client.id);
                                  setShowUploadModal(true);
                                }}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Upload Docs
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/dispute-center?client=${client.id}`, '_blank')}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Start Dispute
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Manager Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Document Management</span>
                </CardTitle>
                <CardDescription>
                  Upload and manage client documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client-select">Select Client</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search and select a client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {searchTerm && (
                      <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="p-2 hover:bg-muted cursor-pointer"
                            onClick={() => {
                              setSelectedClient(client.id);
                              setSearchTerm(client.full_name);
                            }}
                          >
                            <div className="font-medium">{client.full_name}</div>
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedClient && selectedClientData && (
                    <>
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{selectedClientData.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{selectedClientData.email}</p>
                            </div>
                            <Badge variant="default">Selected Client</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <AdminFileUploader 
                        clientId={selectedClient} 
                        onUploadComplete={() => {
                          fetchClientDocuments();
                          toast({
                            title: 'Upload Complete',
                            description: 'Document uploaded successfully',
                          });
                        }}
                      />

                      {/* Document Lists */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Identity Documents */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Identity Documents</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {documents.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No documents</p>
                              ) : (
                                documents.map((doc) => (
                                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-sm">{doc.doc_type}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(doc.uploaded_file_url, '_blank')}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteDocument(doc.id, 'identity')}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Credit Reports */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Credit Reports</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {creditReports.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No reports</p>
                              ) : (
                                creditReports.map((report) => (
                                  <div key={report.id} className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      <div>
                                        <div className="text-sm font-medium">{report.bureau}</div>
                                        <div className="text-xs text-muted-foreground">Score: {report.fico_score}</div>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(report.uploaded_file_url, '_blank')}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => generateAIPreview(report.uploaded_file_url, 'Credit Report')}
                                      >
                                        <Brain className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteDocument(report.id, 'credit')}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Dispute Letters */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Dispute Letters</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {disputeLetters.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No letters</p>
                              ) : (
                                disputeLetters.map((letter) => (
                                  <div key={letter.id} className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <div>
                                        <div className="text-sm font-medium">{letter.creditor_name}</div>
                                        <div className="text-xs text-muted-foreground">{letter.issue_type}</div>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      {letter.uploaded_file_url && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(letter.uploaded_file_url, '_blank')}
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => generateAIPreview(letter.generated_letter, 'Dispute Letter')}
                                      >
                                        <Brain className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteDocument(letter.id, 'dispute')}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dispute Center Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Dispute Center Management</span>
                </CardTitle>
                <CardDescription>
                  Monitor and manage client dispute processes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button onClick={() => window.open('/dispute-center', '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Dispute Center
                    </Button>
                    <Button onClick={() => window.open('/upload-credit-report', '_blank')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Credit Report
                    </Button>
                    <Button onClick={() => window.open('/ai-assistant', '_blank')}>
                      <Brain className="h-4 w-4 mr-2" />
                      AI Assistant
                    </Button>
                  </div>
                  
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Dispute management features will be displayed here</p>
                        <p className="text-sm">Credit report analysis, violation detection, and letter generation</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Document Automation Center</span>
                </CardTitle>
                <CardDescription>
                  AI-powered document processing and automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg">AI Document Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Upload documents for AI-powered analysis and violation detection
                      </p>
                      <Button className="w-full">
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze Documents with AI
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg">Letter Generation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Generate dispute letters and templates using AI
                      </p>
                      <Button className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Letter Templates
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upload Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload documents for {selectedClientData?.full_name}
              </DialogDescription>
            </DialogHeader>
            {selectedClient && (
              <AdminFileUploader 
                clientId={selectedClient} 
                onUploadComplete={() => {
                  fetchClientDocuments();
                  setShowUploadModal(false);
                  toast({
                    title: 'Upload Complete',
                    description: 'Document uploaded successfully',
                  });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}