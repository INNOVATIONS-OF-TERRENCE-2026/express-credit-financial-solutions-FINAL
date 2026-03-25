import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Loader2,
  Search, Filter, Eye, UserCheck, RotateCcw, Save, Package, Zap,
  ChevronDown, ChevronRight, Brain, Users
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'processing' | 'classified' | 'matched' | 'needs_review' | 'ready_to_save' | 'saved' | 'failed';
  detected_document_type?: string;
  extracted_fields?: Record<string, any>;
  matched_client_id?: string;
  matched_client_name?: string;
  confidence_score?: number;
  match_status?: string;
  ai_reason?: string;
  db_file_id?: string;
  storage_path?: string;
}

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  ssn_last4: string;
}

interface BatchInfo {
  id: string;
  total_files: number;
  processed_files: number;
  matched_files: number;
  needs_review_count: number;
  failed_files: number;
  status: string;
}

type FilterMode = 'all' | 'matched' | 'needs_review' | 'saved' | 'failed';

const DOC_TYPE_LABELS: Record<string, string> = {
  social_security_card: 'Social Security Card',
  drivers_license: "Driver's License",
  utility_bill: 'Utility Bill',
  credit_report: 'Credit Report',
  identity_document: 'Identity Document',
  proof_of_address: 'Proof of Address',
  bank_statement: 'Bank Statement',
  other: 'Other',
};

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  queued: { color: 'bg-muted text-muted-foreground', icon: FileText, label: 'Queued' },
  uploading: { color: 'bg-blue-500/10 text-blue-500', icon: Upload, label: 'Uploading' },
  processing: { color: 'bg-purple-500/10 text-purple-500', icon: Brain, label: 'Processing' },
  classified: { color: 'bg-cyan-500/10 text-cyan-500', icon: Search, label: 'Classified' },
  matched: { color: 'bg-green-500/10 text-green-500', icon: UserCheck, label: 'Matched' },
  needs_review: { color: 'bg-orange-500/10 text-orange-500', icon: AlertTriangle, label: 'Needs Review' },
  ready_to_save: { color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2, label: 'Ready' },
  saved: { color: 'bg-primary/10 text-primary', icon: Save, label: 'Saved' },
  failed: { color: 'bg-destructive/10 text-destructive', icon: XCircle, label: 'Failed' },
};

export function BulkDocumentIntelligence() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [reviewFile, setReviewFile] = useState<UploadFile | null>(null);
  const [reassignClientId, setReassignClientId] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [overrideDocType, setOverrideDocType] = useState('');
  const [savingBatch, setSavingBatch] = useState(false);

  // Load clients on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('clients').select('id, full_name, email, ssn_last4');
      if (data) setClients(data);
    })();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      status: 'queued',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 20 * 1024 * 1024,
  });

  const processAllFiles = async () => {
    if (!files.length || isProcessing) return;
    setIsProcessing(true);

    try {
      // Create batch record
      const { data: batchData, error: batchErr } = await supabase
        .from('bulk_upload_batches' as any)
        .insert({ created_by: user!.id, total_files: files.length, status: 'processing' })
        .select()
        .single();

      if (batchErr || !batchData) throw new Error('Failed to create batch');
      const batchId = (batchData as any).id;
      setBatch({ id: batchId, total_files: files.length, processed_files: 0, matched_files: 0, needs_review_count: 0, failed_files: 0, status: 'processing' });

      // Process each file sequentially
      for (let i = 0; i < files.length; i++) {
        const f = files[i];

        // Update status: uploading
        setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, status: 'uploading' as const } : p)));

        // Upload to storage
        const storagePath = `bulk-uploads/${batchId}/${f.id}_${f.file.name}`;
        const { error: uploadErr } = await supabase.storage.from('documents').upload(storagePath, f.file);
        if (uploadErr) {
          setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, status: 'failed' as const, ai_reason: uploadErr.message } : p)));
          continue;
        }

        // Create DB record
        const { data: fileRecord, error: fileErr } = await supabase
          .from('bulk_upload_files' as any)
          .insert({
            batch_id: batchId,
            file_name: f.file.name,
            storage_path: storagePath,
            file_type: f.file.type,
            match_status: 'pending',
          })
          .select()
          .single();

        if (fileErr || !fileRecord) {
          setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, status: 'failed' as const } : p)));
          continue;
        }

        const dbFileId = (fileRecord as any).id;

        // Update status: processing
        setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, status: 'processing' as const, db_file_id: dbFileId, storage_path: storagePath } : p)));

        // Read file as base64 for AI (images only, limit size)
        let fileBase64: string | null = null;
        if (f.file.type.startsWith('image/') && f.file.size < 5 * 1024 * 1024) {
          const buffer = await f.file.arrayBuffer();
          fileBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        }

        // Call edge function
        try {
          const { data: result, error: fnErr } = await supabase.functions.invoke('bulk-document-intelligence-processor', {
            body: {
              file_id: dbFileId,
              file_name: f.file.name,
              file_content_base64: fileBase64,
              batch_id: batchId,
            },
          });

          if (fnErr) throw fnErr;

          const matchedClient = clients.find((c) => c.id === result?.matched_client_id);
          const newStatus = result?.requires_review
            ? 'needs_review'
            : result?.matched_client_id
              ? 'matched'
              : 'failed';

          setFiles((prev) =>
            prev.map((p) =>
              p.id === f.id
                ? {
                    ...p,
                    status: newStatus as any,
                    detected_document_type: result?.detected_document_type,
                    extracted_fields: result?.extracted_fields,
                    matched_client_id: result?.matched_client_id,
                    matched_client_name: matchedClient?.full_name || null,
                    confidence_score: result?.confidence_score,
                    match_status: newStatus,
                    ai_reason: result?.match_reason,
                  }
                : p
            )
          );
        } catch (fnError: any) {
          setFiles((prev) =>
            prev.map((p) => (p.id === f.id ? { ...p, status: 'failed' as const, ai_reason: fnError?.message || 'Processing failed' } : p))
          );
        }

        // Update batch progress
        setBatch((prev) => {
          if (!prev) return prev;
          const updated = files.slice(0, i + 1);
          return {
            ...prev,
            processed_files: i + 1,
            matched_files: updated.filter((u) => u.status === 'matched').length,
            needs_review_count: updated.filter((u) => u.status === 'needs_review').length,
            failed_files: updated.filter((u) => u.status === 'failed').length,
          };
        });
      }

      setBatch((prev) => (prev ? { ...prev, status: 'completed', processed_files: files.length } : prev));
      toast({ title: 'Batch Processing Complete', description: `${files.length} files processed` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmMatch = (fileId: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: 'ready_to_save' as const, match_status: 'matched' } : f)));
  };

  const bulkConfirmMatched = () => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.status === 'matched' || (f.status === 'needs_review' && f.confidence_score && f.confidence_score >= 60)) {
          return { ...f, status: 'ready_to_save' as const };
        }
        return f;
      })
    );
    toast({ title: 'Bulk Confirmed', description: 'High-confidence matches confirmed' });
  };

  const handleReviewSubmit = () => {
    if (!reviewFile) return;
    const clientId = reassignClientId || reviewFile.matched_client_id;
    const client = clients.find((c) => c.id === clientId);
    const docType = overrideDocType || reviewFile.detected_document_type;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === reviewFile.id
          ? {
              ...f,
              status: 'ready_to_save' as const,
              matched_client_id: clientId || null,
              matched_client_name: client?.full_name || f.matched_client_name,
              detected_document_type: docType,
            }
          : f
      )
    );

    // Update review in DB
    if (reviewFile.db_file_id) {
      supabase
        .from('document_match_reviews' as any)
        .update({
          admin_selected_client_id: clientId,
          review_status: clientId ? 'confirmed' : 'unmatched',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          notes: reviewNotes,
        })
        .eq('file_id', reviewFile.db_file_id)
        .then();
    }

    setReviewFile(null);
    setReassignClientId('');
    setReviewNotes('');
    setOverrideDocType('');
  };

  const saveAllReady = async () => {
    const readyFiles = files.filter((f) => f.status === 'ready_to_save' && f.matched_client_id);
    if (!readyFiles.length) {
      toast({ title: 'Nothing to save', description: 'No files ready to save', variant: 'destructive' });
      return;
    }

    setSavingBatch(true);
    let saved = 0;

    for (const f of readyFiles) {
      try {
        // Insert into client_documents for the matched client
        await supabase.from('client_documents').insert({
          user_id: f.matched_client_id!,
          document_type: f.detected_document_type || 'other',
          file_name: f.file.name,
          file_path: f.storage_path,
          status: 'verified',
          notes: `AI classified: ${DOC_TYPE_LABELS[f.detected_document_type || 'other']}. Confidence: ${f.confidence_score}%. ${f.ai_reason || ''}`,
          uploaded_at: new Date().toISOString(),
        });

        // Update bulk_upload_files status
        if (f.db_file_id) {
          await supabase
            .from('bulk_upload_files' as any)
            .update({ match_status: 'saved' })
            .eq('id', f.db_file_id);
        }

        setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, status: 'saved' as const } : p)));
        saved++;
      } catch (err) {
        console.error('Save error for file:', f.file.name, err);
      }
    }

    setSavingBatch(false);
    toast({ title: 'Batch Saved', description: `${saved}/${readyFiles.length} files saved to client profiles` });
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredFiles();
    if (selectedFiles.size === filtered.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filtered.map((f) => f.id)));
    }
  };

  const getFilteredFiles = () => {
    let filtered = files;
    if (filter === 'matched') filtered = files.filter((f) => f.status === 'matched' || f.status === 'ready_to_save');
    else if (filter === 'needs_review') filtered = files.filter((f) => f.status === 'needs_review');
    else if (filter === 'saved') filtered = files.filter((f) => f.status === 'saved');
    else if (filter === 'failed') filtered = files.filter((f) => f.status === 'failed');

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.file.name.toLowerCase().includes(term) ||
          f.matched_client_name?.toLowerCase().includes(term) ||
          f.detected_document_type?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const filteredFiles = getFilteredFiles();

  const counts = {
    all: files.length,
    matched: files.filter((f) => f.status === 'matched' || f.status === 'ready_to_save').length,
    needs_review: files.filter((f) => f.status === 'needs_review').length,
    saved: files.filter((f) => f.status === 'saved').length,
    failed: files.filter((f) => f.status === 'failed').length,
  };

  const progress = batch ? Math.round((batch.processed_files / Math.max(batch.total_files, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {batch && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Batch Progress
              </CardTitle>
              <Badge variant={batch.status === 'completed' ? 'default' : 'secondary'}>{batch.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total', value: batch.total_files, color: 'text-foreground' },
                { label: 'Processed', value: batch.processed_files, color: 'text-blue-500' },
                { label: 'Matched', value: counts.matched, color: 'text-green-500' },
                { label: 'Review', value: counts.needs_review, color: 'text-orange-500' },
                { label: 'Failed', value: counts.failed, color: 'text-destructive' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Zone */}
      {!isProcessing && files.filter((f) => f.status === 'saved').length !== files.length && (
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">
                {isDragActive ? 'Drop files here' : 'Drag & drop client documents here'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">PDFs and images • Multiple clients • Up to 20MB per file</p>
            </div>

            {files.length > 0 && !batch && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{files.length} files queued</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setFiles([])}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={processAllFiles} disabled={isProcessing}>
                    <Zap className="h-4 w-4 mr-2" />
                    Process All ({files.length})
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters + Actions Bar */}
      {files.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {(['all', 'matched', 'needs_review', 'saved', 'failed'] as FilterMode[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className="text-xs"
              >
                {f === 'all' ? 'All' : f === 'needs_review' ? 'Review' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </Button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search files, clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {counts.matched > 0 && (
              <Button size="sm" variant="outline" onClick={bulkConfirmMatched}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Confirm All Matches
              </Button>
            )}
            {files.some((f) => f.status === 'ready_to_save') && (
              <Button size="sm" onClick={saveAllReady} disabled={savingBatch}>
                {savingBatch ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save Ready ({files.filter((f) => f.status === 'ready_to_save').length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* File Table */}
      {filteredFiles.length > 0 && (
        <Card>
          <CardContent className="pt-4 px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Doc Type</TableHead>
                    <TableHead>Matched Client</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((f) => {
                    const sc = STATUS_CONFIG[f.status] || STATUS_CONFIG.queued;
                    const Icon = sc.icon;
                    return (
                      <TableRow key={f.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedFiles.has(f.id)}
                            onCheckedChange={(checked) => {
                              setSelectedFiles((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(f.id);
                                else next.delete(f.id);
                                return next;
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate max-w-[200px]">{f.file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', sc.color)}>
                            <Icon className="h-3 w-3 mr-1" />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{DOC_TYPE_LABELS[f.detected_document_type || ''] || '—'}</span>
                        </TableCell>
                        <TableCell>
                          {f.matched_client_name ? (
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3.5 w-3.5 text-green-500" />
                              <span className="text-sm">{f.matched_client_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {f.confidence_score != null ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                f.confidence_score >= 60 ? 'border-green-500 text-green-600' : f.confidence_score >= 30 ? 'border-orange-500 text-orange-600' : 'border-destructive text-destructive'
                              )}
                            >
                              {Math.round(f.confidence_score)}%
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {f.status === 'needs_review' && (
                              <Button size="sm" variant="outline" onClick={() => { setReviewFile(f); setReassignClientId(f.matched_client_id || ''); setOverrideDocType(f.detected_document_type || ''); }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {f.status === 'matched' && (
                              <Button size="sm" variant="outline" onClick={() => confirmMatch(f.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {f.status === 'failed' && (
                              <span className="text-xs text-muted-foreground max-w-[120px] truncate">{f.ai_reason}</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewFile} onOpenChange={(open) => !open && setReviewFile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Document Match</DialogTitle>
          </DialogHeader>
          {reviewFile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">File</p>
                  <p className="font-medium">{reviewFile.file.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Detected Type</p>
                  <p className="font-medium">{DOC_TYPE_LABELS[reviewFile.detected_document_type || ''] || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confidence</p>
                  <p className="font-medium">{Math.round(reviewFile.confidence_score || 0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium text-xs">{reviewFile.ai_reason || 'N/A'}</p>
                </div>
              </div>

              {reviewFile.extracted_fields && Object.keys(reviewFile.extracted_fields).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Extracted Data</p>
                  <div className="bg-muted/50 rounded p-2 text-xs space-y-1">
                    {Object.entries(reviewFile.extracted_fields).map(([k, v]) =>
                      v ? (
                        <div key={k} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{String(v)}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Override Document Type</p>
                <Select value={overrideDocType} onValueChange={setOverrideDocType}>
                  <SelectTrigger><SelectValue placeholder="Keep detected type" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Assign / Reassign Client</p>
                <Select value={reassignClientId} onValueChange={setReassignClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name} {c.email ? `(${c.email})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Notes</p>
                <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Optional review notes..." rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewFile(null)}>Cancel</Button>
            <Button variant="secondary" onClick={() => {
              if (reviewFile) {
                setFiles((prev) => prev.map((f) => f.id === reviewFile.id ? { ...f, status: 'failed' as const, ai_reason: 'Marked unknown by admin' } : f));
                setReviewFile(null);
              }
            }}>Mark Unknown</Button>
            <Button onClick={handleReviewSubmit} disabled={!reassignClientId}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
