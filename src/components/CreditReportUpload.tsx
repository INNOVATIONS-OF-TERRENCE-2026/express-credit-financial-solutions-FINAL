import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Trash2, Eye } from 'lucide-react';

interface CreditReport {
  id: string;
  file_path: string;
  uploaded_at: string;
  doc_type: string;
}

export function CreditReportUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creditReports, setCreditReports] = useState<CreditReport[]>([]);
  const { toast } = useToast();

  const fetchCreditReports = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('doc_type', 'credit_report')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setCreditReports(data || []);
    } catch (error) {
      console.error('Error fetching credit reports:', error);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Resolve the caller's client row so the document is linked to a
      // client when one exists (prevents orphaned document rows).
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Save record to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          client_id: clientRow?.id ?? null,
          file_path: fileName,
          doc_type: 'credit_report'
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Credit report uploaded successfully!",
      });

      // Trigger email notification
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'document_upload',
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email,
          fileName: file.name
        }
      });

      await fetchCreditReports();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload credit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleDelete = async (reportId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', reportId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Credit report deleted successfully",
      });

      await fetchCreditReports();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete credit report",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating preview:', error);
      toast({
        title: "Error",
        description: "Failed to preview file",
        variant: "destructive",
      });
    }
  };

  // Load reports on component mount
  useState(() => {
    fetchCreditReports();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Credit Report Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Upload Credit Report</h3>
          <p className="text-muted-foreground mb-4">
            Upload your IdentityIQ, SmartCredit, or other credit report PDF files
          </p>
          
          <label htmlFor="credit-upload" className="cursor-pointer">
            <Button disabled={uploading} className="mb-4">
              {uploading ? 'Uploading...' : 'Browse Files'}
            </Button>
          </label>
          
          <input
            id="credit-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          
          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(uploadProgress)}% uploaded
              </p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            PDF files only, max 10MB
          </p>
        </div>

        {creditReports.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Uploaded Credit Reports</h3>
            <div className="space-y-2">
              {creditReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Credit Report - {new Date(report.uploaded_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(report.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary">PDF</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePreview(report.file_path)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(report.id, report.file_path)}
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}