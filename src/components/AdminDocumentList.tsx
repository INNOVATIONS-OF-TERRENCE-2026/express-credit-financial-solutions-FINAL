import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, Loader2, FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { previewFile, downloadFile, formatFileSize } from '@/lib/documentUtils';

interface DocRecord {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  analysis_status: string;
  uploaded_at: string;
  user_id: string;
  client_id: string | null;
}

export function AdminDocumentList() {
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_report_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDocs((data as any[]) || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleView = async (doc: DocRecord) => {
    setActionId(`v-${doc.id}`);
    try {
      await previewFile('document-uploads', doc.file_path);
    } catch {
      toast({ title: 'Preview failed', description: 'Could not generate preview URL', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  };

  const handleDownload = async (doc: DocRecord) => {
    setActionId(`d-${doc.id}`);
    try {
      await downloadFile('document-uploads', doc.file_path, doc.file_name);
    } catch {
      toast({ title: 'Download failed', description: 'Could not download file', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Uploaded Documents</CardTitle>
          <CardDescription>All documents uploaded across the platform</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDocs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading documents...</p>
        ) : docs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{doc.file_name}</TableCell>
                    <TableCell><Badge variant="outline">{doc.file_type?.split('/')[1] || 'file'}</Badge></TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>
                      <Badge variant={doc.analysis_status === 'completed' ? 'default' : 'secondary'}>
                        {doc.analysis_status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleView(doc)} disabled={actionId === `v-${doc.id}`}>
                          {actionId === `v-${doc.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)} disabled={actionId === `d-${doc.id}`}>
                          {actionId === `d-${doc.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
