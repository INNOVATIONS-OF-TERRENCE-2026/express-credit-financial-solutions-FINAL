import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileUploader } from '@/components/FileUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Users, FileText, Search, Eye, Download, Trash2 } from 'lucide-react';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
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

export function AdminDocumentUploader() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [creditReports, setCreditReports] = useState<CreditReport[]>([]);
  const [disputeLetters, setDisputeLetters] = useState<DisputeLetter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const documentTypes = ['Driver\'s License', 'SSN Card', 'Utility Bill', 'Lease', 'Pay Stub'];
  const bureaus = ['Experian', 'Equifax', 'TransUnion'];

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientDocuments();
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, email, phone')
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
        .from('identity_docs')
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

  const handleDocumentUpload = async (docType: string, fileUrl: string) => {
    if (!selectedClient) return;

    try {
      const { error } = await supabase
        .from('identity_docs')
        .insert({
          client_id: selectedClient,
          doc_type: docType,
          uploaded_file_url: fileUrl
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${docType} uploaded successfully`,
      });

      fetchClientDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: 'Error',
        description: 'Failed to save document',
        variant: 'destructive',
      });
    }
  };

  const handleCreditReportUpload = async (bureau: string, fileUrl: string) => {
    if (!selectedClient) return;

    try {
      const { error } = await supabase
        .from('credit_reports')
        .insert({
          client_id: selectedClient,
          bureau: bureau,
          uploaded_file_url: fileUrl,
          notes: `${bureau} credit report uploaded by admin`,
          fico_score: 650,
          user_id: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${bureau} credit report uploaded successfully`,
      });

      fetchClientDocuments();
    } catch (error) {
      console.error('Error saving credit report:', error);
      toast({
        title: 'Error',
        description: 'Failed to save credit report',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async (docId: string, type: 'identity' | 'credit' | 'dispute') => {
    try {
      let error;
      
      if (type === 'identity') {
        ({ error } = await supabase.from('identity_docs').delete().eq('id', docId));
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

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClientData = clients.find(c => c.id === selectedClient);

  if (loading) {
    return <div className="text-center p-6">Loading admin interface...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Admin Document Management
          </CardTitle>
          <CardDescription>
            Upload and manage documents for all clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Search and Selection */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Clients</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="client">Select Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <span>{client.full_name}</span>
                          <span className="text-xs text-muted-foreground">({client.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedClientData && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{selectedClientData.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedClientData.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="default">Client</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/client-preview/${selectedClientData.id}`, '_blank')}
                      >
                        View Portal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClient && (
        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="identity">Identity Docs ({documents.length})</TabsTrigger>
            <TabsTrigger value="credit">Credit Reports ({creditReports.length})</TabsTrigger>
            <TabsTrigger value="disputes">Dispute Letters ({disputeLetters.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Identity Documents Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Identity Documents</CardTitle>
                  <CardDescription>
                    Upload required identity verification documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documentTypes.map((docType) => {
                      const existingDoc = documents.find(doc => doc.doc_type === docType);
                      
                      if (existingDoc) {
                        return (
                          <div key={docType} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">{docType}</span>
                            </div>
                            <Badge variant="secondary">Uploaded</Badge>
                          </div>
                        );
                      }

                      return (
                        <FileUploader
                          key={docType}
                          clientId={selectedClient}
                          docType={docType}
                          bucket="client-documents"
                          onUploadComplete={(url) => handleDocumentUpload(docType, url)}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Credit Reports Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Credit Reports</CardTitle>
                  <CardDescription>
                    Upload credit reports from all three bureaus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bureaus.map((bureau) => {
                      const existingReport = creditReports.find(report => report.bureau === bureau);
                      
                      if (existingReport) {
                        return (
                          <div key={bureau} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">{bureau}</span>
                            </div>
                            <Badge variant="secondary">Uploaded</Badge>
                          </div>
                        );
                      }

                      return (
                        <FileUploader
                          key={bureau}
                          clientId={selectedClient}
                          docType={`${bureau} Credit Report`}
                          bucket="client-documents"
                          onUploadComplete={(url) => handleCreditReportUpload(bureau, url)}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle>Identity Documents</CardTitle>
                <CardDescription>
                  Manage uploaded identity verification documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No identity documents uploaded yet</p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.doc_type}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.uploaded_file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.uploaded_file_url;
                              link.download = `${doc.doc_type}.pdf`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteDocument(doc.id, 'identity')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit">
            <Card>
              <CardHeader>
                <CardTitle>Credit Reports</CardTitle>
                <CardDescription>
                  Manage uploaded credit reports from all bureaus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creditReports.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No credit reports uploaded yet</p>
                  ) : (
                    creditReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{report.bureau} Credit Report</p>
                            <p className="text-sm text-muted-foreground">{report.notes}</p>
                            <p className="text-sm text-muted-foreground">
                              Score: {report.fico_score} • {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(report.uploaded_file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = report.uploaded_file_url;
                              link.download = `${report.bureau}-credit-report.pdf`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteDocument(report.id, 'credit')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Letters</CardTitle>
                <CardDescription>
                  View and manage generated dispute letters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {disputeLetters.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No dispute letters generated yet</p>
                  ) : (
                    disputeLetters.map((letter) => (
                      <div key={letter.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{letter.creditor_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Account: {letter.account_number} • {letter.issue_type}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Generated {new Date(letter.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {letter.uploaded_file_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(letter.uploaded_file_url, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteDocument(letter.id, 'dispute')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}