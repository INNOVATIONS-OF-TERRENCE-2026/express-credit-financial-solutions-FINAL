import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFileUploadSecurity } from '@/hooks/useFileUploadSecurity';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Trash2, Eye, Download, CheckCircle, AlertCircle, Clock, Loader2, X } from 'lucide-react';
import { downloadAsPdf } from '@/lib/documentUtils';
type QueueItemStatus = 'queued' | 'uploading' | 'analyzing' | 'success' | 'error';

interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  status: QueueItemStatus;
  progress: number;
  message?: string;
}


const MAX_PDF_SIZE_MB = 10;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

/**
 * Strict client-side validation for credit reports.
 * Only PDFs are accepted, with a hard size cap. Returns null when valid.
 */
export function validateCreditReportFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isPdf = ext === 'pdf' || file.type === 'application/pdf';
  if (!isPdf) {
    return 'Only PDF credit reports are accepted.';
  }
  if (file.size === 0) {
    return 'This file appears to be empty.';
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${MAX_PDF_SIZE_MB}MB.`;
  }
  return null;
}

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
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [uploads, setUploads] = useState<CreditReportUpload[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { sanitizeFileName } = useFileUploadSecurity();

  const uploading = useMemo(
    () => queue.some((q) => q.status === 'queued' || q.status === 'uploading' || q.status === 'analyzing'),
    [queue],
  );
  const overallProgress = useMemo(() => {
    if (queue.length === 0) return 0;
    const total = queue.reduce((sum, q) => sum + q.progress, 0);
    return Math.round(total / queue.length);
  }, [queue]);

  const updateItem = useCallback((id: string, patch: Partial<UploadQueueItem>) => {
    setQueue((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setQueue((prev) => prev.filter((it) => it.status === 'queued' || it.status === 'uploading' || it.status === 'analyzing'));
  }, []);

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

  const triggerAnalysis = async (uploadId: string, filePath: string, fileName: string): Promise<boolean> => {
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
      return true;
    } catch (error) {
      console.error('Error triggering analysis:', error);
      
      // Update status to failed
      await supabase
        .from('credit_report_uploads')
        .update({ analysis_status: 'failed' })
        .eq('id', uploadId);

      await fetchUploads();
      return false;
    }
  };

  const uploadOne = useCallback(
    async (item: UploadQueueItem, file: File, userId: string) => {
      // Simulated progress ticker for the storage upload (supabase-js has no native progress event).
      let pct = 5;
      updateItem(item.id, { status: 'uploading', progress: pct, message: 'Uploading…' });
      const ticker = setInterval(() => {
        pct = Math.min(85, pct + 7);
        updateItem(item.id, { progress: pct });
      }, 200);

      try {
        const sanitizedFileName = sanitizeFileName(file.name);
        const storagePath = `${userId}/${Date.now()}_${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('credit-reports')
          .upload(storagePath, file, { contentType: 'application/pdf', upsert: false });

        if (uploadError) {
          clearInterval(ticker);
          updateItem(item.id, { status: 'error', progress: 100, message: uploadError.message });
          toast({
            title: 'Upload failed',
            description: `${file.name}: ${uploadError.message}`,
            variant: 'destructive',
          });
          return;
        }

        updateItem(item.id, { progress: 92, message: 'Saving record…' });

        const { data: uploadData, error: dbError } = await supabase
          .from('credit_report_uploads')
          .insert({
            user_id: userId,
            file_name: file.name,
            file_path: storagePath,
            file_type: 'pdf',
            file_size: file.size,
            analysis_status: 'pending',
          })
          .select()
          .single();

        if (dbError) {
          clearInterval(ticker);
          updateItem(item.id, { status: 'error', progress: 100, message: dbError.message });
          toast({
            title: 'Database error',
            description: `${file.name}: ${dbError.message}`,
            variant: 'destructive',
          });
          return;
        }

        clearInterval(ticker);
        updateItem(item.id, { status: 'analyzing', progress: 98, message: 'Starting analysis…' });
        if (uploadData) {
          await triggerAnalysis(uploadData.id, storagePath, file.name);
        }

        updateItem(item.id, { status: 'success', progress: 100, message: 'Uploaded' });
        toast({
          title: 'Upload successful',
          description: `${file.name} received. Analysis started.`,
        });
      } catch (err: any) {
        clearInterval(ticker);
        updateItem(item.id, {
          status: 'error',
          progress: 100,
          message: err?.message || 'Upload failed',
        });
        toast({
          title: 'Upload failed',
          description: `${file.name}: ${err?.message || 'Unexpected error'}`,
          variant: 'destructive',
        });
      }
    },
    [sanitizeFileName, toast, updateItem],
  );

  const handleFileUpload = async (files: FileList | File[]) => {
    const list = Array.from(files as ArrayLike<File>);
    if (list.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in to upload credit reports.',
        variant: 'destructive',
      });
      return;
    }

    // Build queue items and validate up-front (pure synchronous classification)
    const accepted: Array<{ item: UploadQueueItem; file: File }> = [];
    const newQueueItems: UploadQueueItem[] = [];
    for (const file of list) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
      const err = validateCreditReportFile(file);
      if (err) {
        newQueueItems.push({ id, name: file.name, size: file.size, status: 'error', progress: 100, message: err });
        toast({ title: 'Invalid file', description: `${file.name}: ${err}`, variant: 'destructive' });
        continue;
      }
      const item: UploadQueueItem = { id, name: file.name, size: file.size, status: 'queued', progress: 0 };
      newQueueItems.push(item);
      accepted.push({ item, file });
    }

    setQueue((prev) => [...prev, ...newQueueItems]);

    if (accepted.length === 0) return;

    // Run uploads in parallel — each owns its own progress
    await Promise.all(accepted.map(({ item, file }) => uploadOne(item, file, user.id)));
    await fetchUploads();
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
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload credit report"
          aria-disabled={uploading}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (uploading) return;
            if (e.dataTransfer.files?.length) {
              handleFileUpload(e.dataTransfer.files);
            }
          }}
          className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors cursor-pointer select-none touch-manipulation active:scale-[0.99] ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/50'
          } ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
          <h3 className="text-base sm:text-lg font-medium mb-2">Upload Credit Reports</h3>
          <p className="text-sm text-muted-foreground mb-4 px-2">
            <span className="hidden sm:inline">Drag &amp; drop a PDF here, or </span>
            <span className="sm:hidden">Tap below to </span>
            <span className="hidden sm:inline">browse</span>
            <span className="sm:hidden">choose a PDF</span> from your device.
          </p>

          <Button
            type="button"
            disabled={uploading}
            className="mb-4 w-full sm:w-auto"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            {uploading ? 'Uploading...' : 'Browse Files'}
          </Button>

          <input
            ref={inputRef}
            id="credit-upload"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileSelect}
            multiple
            className="hidden"
            disabled={uploading}
            data-testid="credit-upload-input"
          />

          {uploading && (
            <div className="mt-4" aria-live="polite">
              <Progress value={overallProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Uploading {queue.filter((q) => q.status !== 'success' && q.status !== 'error').length} of {queue.length}
                {' '}({overallProgress}%)
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            PDF only · Max {MAX_PDF_SIZE_MB}MB per file
          </p>
        </div>

        {queue.length > 0 && (
          <div className="space-y-2" data-testid="upload-queue">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">This upload</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFinished}
                disabled={uploading}
              >
                Clear finished
              </Button>
            </div>
            <ul className="space-y-2">
              {queue.map((item) => (
                <li
                  key={item.id}
                  data-testid={`queue-item-${item.name}`}
                  data-status={item.status}
                  className="flex items-center gap-3 rounded-lg border bg-card/60 p-3"
                >
                  <div className="rounded-md p-2 bg-muted shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatFileSize(item.size)}
                      </span>
                    </div>
                    {(item.status === 'queued' || item.status === 'uploading' || item.status === 'analyzing') && (
                      <Progress value={item.progress} className="mt-1.5 h-1" />
                    )}
                    {item.message && (
                      <p
                        className={`text-[11px] mt-1 break-words ${
                          item.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                        }`}
                      >
                        {item.message}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {(item.status === 'queued' || item.status === 'uploading') && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {item.status === 'analyzing' && (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    {(item.status === 'success' || item.status === 'error') && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Dismiss ${item.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploads.length === 0 && !uploading && (
          <p className="text-center text-sm text-muted-foreground">
            No credit reports uploaded yet. Upload your first report above to get started.
          </p>
        )}

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