import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFileUploadSecurity } from '@/hooks/useFileUploadSecurity';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Trash2, Eye, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { downloadAsPdf } from '@/lib/documentUtils';

interface CreditReportUpload {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  analysis_status: string;
  analysis_url: string | null;
  flagged_accounts_count: number;
  ai_analysis_summary: string | null;
}

export function EnhancedCreditReportUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploads, setUploads] = useState<CreditReportUpload[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { validateFile, sanitizeFileName } = useFileUploadSecurity();

  const fetchUploads = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('credit_report_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error",
        description: "Failed to load uploaded files",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const triggerAnalysis = async (uploadId: string, filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-credit-report', {
        body: {
          creditReportPath: filePath,
          fileName: fileName,
          reportId: uploadId
        }
      });

      if (error) throw error;

      // Update the upload status
      await supabase
        .from('credit_report_uploads')
        .update({ 
          analysis_status: 'analyzing',
          flagged_accounts_count: data.flaggedAccountsCount || 0
        })
        .eq('id', uploadId);

      await fetchUploads();

      toast({
        title: "Analysis Started",
        description: `Analysis initiated for ${fileName}. Results will be available shortly.`,
      });
    } catch (error) {
      console.error('Error triggering analysis:', error);
      
      // Update status to failed
      await supabase
        .from('credit_report_uploads')
        .update({ analysis_status: 'failed' })
        .eq('id', uploadId);

      await fetchUploads();

      toast({
        title: "Analysis Failed",
        description: "Failed to analyze credit report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const totalFiles = files.length;
    let processed = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (const file of Array.from(files)) {
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast({
            title: "Invalid File",
            description: `${file.name}: ${validation.error}`,
            variant: "destructive",
          });
          continue;
        }

        const sanitizedFileName = sanitizeFileName(file.name);
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${user.id}/${Date.now()}_${sanitizedFileName}`;

        // Upload to Supabase Storage under credit-reports bucket
        const { error: uploadError } = await supabase.storage
          .from('credit-reports')
          .upload(fileName, file);

        if (uploadError) {
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}: ${uploadError.message}`,
            variant: "destructive",
          });
          continue;
        }

        // Save record to database
        const { data: uploadData, error: dbError } = await supabase
          .from('credit_report_uploads')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: fileName,
            file_type: fileExt || 'unknown',
            file_size: file.size,
            analysis_status: 'pending'
          })
          .select()
          .single();

        if (dbError) {
          toast({
            title: "Database Error",
            description: `Failed to save ${file.name} record: ${dbError.message}`,
            variant: "destructive",
          });
          continue;
        }

        // Trigger analysis for PDF files
        if (fileExt === 'pdf' && uploadData) {
          await triggerAnalysis(uploadData.id, fileName, file.name);
        }

        processed++;
        setUploadProgress((processed / totalFiles) * 100);
      }

      if (processed > 0) {
        toast({
          title: "Upload Successful",
          description: `Successfully uploaded ${processed} file(s)`,
        });
        await fetchUploads();
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileUpload(files);
    }
    // Reset input
    event.target.value = '';
  };

  const handleDelete = async (uploadId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('credit-reports')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('credit_report_uploads')
        .delete()
        .eq('id', uploadId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      await fetchUploads();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      await downloadAsPdf('credit-reports', filePath, fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('credit-reports')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      analyzing: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredUploads = uploads.filter(upload => 
    upload.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upload.file_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Credit Report Upload Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Upload Credit Reports</h3>
          <p className="text-muted-foreground mb-4">
            Upload your credit reports in various formats for AI analysis
          </p>
          
          <label htmlFor="credit-upload" className="cursor-pointer">
            <Button disabled={uploading} className="mb-4">
              {uploading ? 'Uploading...' : 'Browse Files'}
            </Button>
          </label>
          
          <input
            id="credit-upload"
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.csv,.txt"
            onChange={handleFileSelect}
            multiple
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
            Supported: PDF, DOC, DOCX, PNG, JPG, CSV, TXT (max 10MB each)
          </p>
        </div>

        {/* Uploaded Files */}
        {uploads.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Uploaded Files ({uploads.length})</h3>
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flagged Items</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {upload.file_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {upload.file_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(upload.file_size)}</TableCell>
                      <TableCell>
                        {new Date(upload.uploaded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(upload.analysis_status)}
                          {getStatusBadge(upload.analysis_status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {upload.flagged_accounts_count > 0 ? (
                          <Badge variant="destructive">
                            {upload.flagged_accounts_count} issues
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handlePreview(upload.file_path)}
                            size="sm"
                            variant="outline"
                            title="Preview file"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDownload(upload.file_path, upload.file_name)}
                            size="sm"
                            variant="outline"
                            title="Download file"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(upload.id, upload.file_path)}
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            title="Delete file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}