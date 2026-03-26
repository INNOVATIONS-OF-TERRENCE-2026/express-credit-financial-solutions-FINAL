import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/FileUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Eye, Download, Loader2 } from 'lucide-react';
import { previewFile, downloadFile } from '@/lib/documentUtils';

interface ClientDocumentManagerProps {
  clientId: string;
}

interface Document {
  id: string;
  doc_type: string;
  uploaded_file_url: string;
  created_at: string;
}

interface CreditReport {
  id: string;
  bureau: string;
  uploaded_file_url: string;
  notes?: string;
  created_at: string;
}

export function ClientDocumentManager({ clientId }: ClientDocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [creditReports, setCreditReports] = useState<CreditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const documentTypes = ['Driver\'s License', 'SSN Card', 'Utility Bill', 'Lease', 'Pay Stub'];
  const bureaus = ['Experian', 'Equifax', 'TransUnion'];

  useEffect(() => {
    fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      const { data: docsData, error: docsError } = await supabase
        .from('identity_docs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (docsError) throw docsError;
      setDocuments(docsData || []);

      const { data: reportsData, error: reportsError } = await supabase
        .from('credit_reports')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (reportsError) throw reportsError;
      setCreditReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({ title: 'Error', description: 'Failed to load documents', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (path: string, id: string) => {
    setActionLoading(`view-${id}`);
    try {
      await previewFile('client-documents', path);
    } catch {
      toast({ title: 'Preview failed', description: 'Could not generate preview URL. The file may not exist in storage.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (path: string, filename: string, id: string) => {
    setActionLoading(`dl-${id}`);
    try {
      await downloadFile('client-documents', path, filename);
    } catch {
      toast({ title: 'Download failed', description: 'Could not download file. The file may not exist in storage.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDocumentUpload = async (docType: string, fileUrl: string) => {
    try {
      const { error } = await supabase.from('identity_docs').insert({
        client_id: clientId, doc_type: docType, uploaded_file_url: fileUrl,
      });
      if (error) throw error;
      toast({ title: 'Success', description: `${docType} uploaded successfully` });
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast({ title: 'Error', description: 'Failed to save document', variant: 'destructive' });
    }
  };

  const handleCreditReportUpload = async (bureau: string, fileUrl: string) => {
    try {
      const { error } = await supabase.from('credit_reports').insert({
        client_id: clientId, bureau, uploaded_file_url: fileUrl,
        notes: `${bureau} credit report uploaded`, fico_score: 650,
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
      });
      if (error) throw error;
      toast({ title: 'Success', description: `${bureau} credit report uploaded successfully` });
      fetchDocuments();
    } catch (error) {
      console.error('Error saving credit report:', error);
      toast({ title: 'Error', description: 'Failed to save credit report', variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-center p-6">Loading documents...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identity Documents</CardTitle>
          <CardDescription>Upload required identity verification documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTypes.map((docType) => {
              const existingDoc = documents.find(doc => doc.doc_type === docType);
              if (existingDoc) {
                return (
                  <Card key={docType} className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-300">{docType}</p>
                            <p className="text-xs text-green-600">{new Date(existingDoc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" disabled={actionLoading === `view-${existingDoc.id}`}
                            onClick={() => handleView(existingDoc.uploaded_file_url, existingDoc.id)}>
                            {actionLoading === `view-${existingDoc.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" disabled={actionLoading === `dl-${existingDoc.id}`}
                            onClick={() => handleDownload(existingDoc.uploaded_file_url, `${docType}.pdf`, existingDoc.id)}>
                            {actionLoading === `dl-${existingDoc.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return (
                <FileUploader key={docType} clientId={clientId} docType={docType} bucket="client-documents"
                  onUploadComplete={(url) => handleDocumentUpload(docType, url)} />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit Reports</CardTitle>
          <CardDescription>Upload credit reports from all three bureaus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bureaus.map((bureau) => {
              const existingReport = creditReports.find(r => r.bureau === bureau);
              if (existingReport) {
                return (
                  <Card key={bureau} className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-800 dark:text-blue-300">{bureau}</p>
                            <p className="text-xs text-blue-600">{existingReport.notes}</p>
                            <p className="text-xs text-blue-600">{new Date(existingReport.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" disabled={actionLoading === `view-${existingReport.id}`}
                            onClick={() => handleView(existingReport.uploaded_file_url, existingReport.id)}>
                            {actionLoading === `view-${existingReport.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" disabled={actionLoading === `dl-${existingReport.id}`}
                            onClick={() => handleDownload(existingReport.uploaded_file_url, `${bureau}-credit-report.pdf`, existingReport.id)}>
                            {actionLoading === `dl-${existingReport.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return (
                <FileUploader key={bureau} clientId={clientId} docType={`${bureau} Credit Report`} bucket="client-documents"
                  onUploadComplete={(url) => handleCreditReportUpload(bureau, url)} />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
