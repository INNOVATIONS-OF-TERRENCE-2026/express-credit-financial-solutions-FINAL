import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Eye,
  UserCheck,
  Save,
  Package,
  Zap,
  Brain,
  FolderOpen,
  Trash2,
} from "lucide-react";

interface UploadFile {
  id: string;
  file: File;
  status:
    | "queued"
    | "uploading"
    | "processing"
    | "classified"
    | "matched"
    | "needs_review"
    | "ready_to_save"
    | "saved"
    | "failed";
  detected_document_type?: string;
  extracted_fields?: Record<string, any>;
  matched_client_id?: string | null;
  matched_client_name?: string | null;
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
  ssn_last4: string | null;
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

type FilterMode = "all" | "matched" | "needs_review" | "saved" | "failed";

const DOC_TYPE_LABELS: Record<string, string> = {
  social_security_card: "Social Security Card",
  drivers_license: "Driver's License",
  utility_bill: "Utility Bill",
  credit_report: "Credit Report",
  identity_document: "Identity Document",
  proof_of_address: "Proof of Address",
  bank_statement: "Bank Statement",
  other: "Other",
};

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ComponentType<any> }> = {
  queued: { color: "bg-muted text-muted-foreground", label: "Queued", icon: FileText },
  uploading: { color: "bg-blue-500/10 text-blue-500", label: "Uploading", icon: Upload },
  processing: { color: "bg-purple-500/10 text-purple-500", label: "Processing", icon: Brain },
  classified: { color: "bg-cyan-500/10 text-cyan-500", label: "Classified", icon: Brain },
  matched: { color: "bg-green-500/10 text-green-500", label: "Matched", icon: UserCheck },
  needs_review: { color: "bg-orange-500/10 text-orange-500", label: "Needs Review", icon: AlertTriangle },
  ready_to_save: { color: "bg-emerald-500/10 text-emerald-500", label: "Ready to Save", icon: CheckCircle2 },
  saved: { color: "bg-primary/10 text-primary", label: "Saved", icon: Save },
  failed: { color: "bg-destructive/10 text-destructive", label: "Failed", icon: XCircle },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function BulkDocumentIntelligence() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [reviewFile, setReviewFile] = useState<UploadFile | null>(null);
  const [reassignClientId, setReassignClientId] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [overrideDocType, setOverrideDocType] = useState("");
  const [savingBatch, setSavingBatch] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("clients").select("id, full_name, email, ssn_last4");
      if (error) {
        toast({
          title: "Failed to load clients",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setClients((data || []) as Client[]);
    })();
  }, [toast]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "queued",
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      toast({
        title: "Files added",
        description: `${acceptedFiles.length} file${acceptedFiles.length === 1 ? "" : "s"} queued`,
      });
    },
    [toast],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    multiple: true,
    maxSize: 20 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    onDropRejected: (rejections) => {
      const first = rejections[0];
      toast({
        title: "Some files were rejected",
        description:
          first?.errors?.[0]?.message || "Only PDF, JPG, JPEG, PNG, and WEBP files up to 20MB are supported.",
        variant: "destructive",
      });
    },
  });

  const counts = useMemo(
    () => ({
      all: files.length,
      matched: files.filter((f) => f.status === "matched" || f.status === "ready_to_save").length,
      needs_review: files.filter((f) => f.status === "needs_review").length,
      saved: files.filter((f) => f.status === "saved").length,
      failed: files.filter((f) => f.status === "failed").length,
    }),
    [files],
  );

  const progress = batch ? Math.round((batch.processed_files / Math.max(batch.total_files, 1)) * 100) : 0;

  const getFilteredFiles = useCallback(() => {
    let filtered = files;

    if (filter === "matched") {
      filtered = filtered.filter((f) => f.status === "matched" || f.status === "ready_to_save");
    } else if (filter === "needs_review") {
      filtered = filtered.filter((f) => f.status === "needs_review");
    } else if (filter === "saved") {
      filtered = filtered.filter((f) => f.status === "saved");
    } else if (filter === "failed") {
      filtered = filtered.filter((f) => f.status === "failed");
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.file.name.toLowerCase().includes(term) ||
          (f.matched_client_name || "").toLowerCase().includes(term) ||
          (f.detected_document_type || "").toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [files, filter, searchTerm]);

  const filteredFiles = getFilteredFiles();

  const recalcBatchFromFiles = useCallback(
    (allFiles: UploadFile[], batchId: string, status = "processing"): BatchInfo => {
      return {
        id: batchId,
        total_files: allFiles.length,
        processed_files: allFiles.filter((f) => !["queued", "uploading", "processing"].includes(f.status)).length,
        matched_files: allFiles.filter((f) => ["matched", "ready_to_save", "saved"].includes(f.status)).length,
        needs_review_count: allFiles.filter((f) => f.status === "needs_review").length,
        failed_files: allFiles.filter((f) => f.status === "failed").length,
        status,
      };
    },
    [],
  );

  const processAllFiles = async () => {
    if (!user?.id) {
      toast({
        title: "Not signed in",
        description: "You must be signed in to upload and process files.",
        variant: "destructive",
      });
      return;
    }

    const queuedOrFailed = files.filter((f) => f.status === "queued" || f.status === "failed");
    if (!queuedOrFailed.length || isProcessing) return;

    setIsProcessing(true);

    try {
      const { data: batchData, error: batchErr } = await supabase
        .from("bulk_upload_batches" as any)
        .insert({
          created_by: user.id,
          total_files: queuedOrFailed.length,
          status: "processing",
        })
        .select()
        .single();

      if (batchErr || !batchData) {
        throw new Error(batchErr?.message || "Failed to create batch");
      }

      const batchId = (batchData as any).id;
      setBatch({
        id: batchId,
        total_files: queuedOrFailed.length,
        processed_files: 0,
        matched_files: 0,
        needs_review_count: 0,
        failed_files: 0,
        status: "processing",
      });

      let workingFiles = [...files];

      for (const current of queuedOrFailed) {
        workingFiles = workingFiles.map((f) =>
          f.id === current.id ? { ...f, status: "uploading" as const, ai_reason: undefined } : f,
        );
        setFiles([...workingFiles]);

        const sanitizedName = current.file.name.replace(/\s+/g, "_");
        const storagePath = `bulk-uploads/${batchId}/${current.id}_${sanitizedName}`;

        const { error: uploadErr } = await supabase.storage.from("documents").upload(storagePath, current.file, {
          upsert: false,
        });

        if (uploadErr) {
          workingFiles = workingFiles.map((f) =>
            f.id === current.id
              ? { ...f, status: "failed" as const, ai_reason: uploadErr.message, storage_path: storagePath }
              : f,
          );
          setFiles([...workingFiles]);
          setBatch(recalcBatchFromFiles(workingFiles, batchId, "processing"));
          continue;
        }

        const { data: fileRecord, error: fileErr } = await supabase
          .from("bulk_upload_files" as any)
          .insert({
            batch_id: batchId,
            file_name: current.file.name,
            storage_path: storagePath,
            file_type: current.file.type || "application/octet-stream",
            match_status: "pending",
          })
          .select()
          .single();

        if (fileErr || !fileRecord) {
          workingFiles = workingFiles.map((f) =>
            f.id === current.id
              ? { ...f, status: "failed" as const, ai_reason: fileErr?.message || "Failed to create file record" }
              : f,
          );
          setFiles([...workingFiles]);
          setBatch(recalcBatchFromFiles(workingFiles, batchId, "processing"));
          continue;
        }

        const dbFileId = (fileRecord as any).id;

        workingFiles = workingFiles.map((f) =>
          f.id === current.id
            ? {
                ...f,
                status: "processing" as const,
                db_file_id: dbFileId,
                storage_path: storagePath,
              }
            : f,
        );
        setFiles([...workingFiles]);

        let fileBase64: string | null = null;
        if (current.file.type.startsWith("image/") && current.file.size < 5 * 1024 * 1024) {
          const buffer = await current.file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          fileBase64 = btoa(binary);
        }

        try {
          const { data: result, error: fnErr } = await supabase.functions.invoke(
            "bulk-document-intelligence-processor",
            {
              body: {
                file_id: dbFileId,
                file_name: current.file.name,
                file_content_base64: fileBase64,
                batch_id: batchId,
              },
            },
          );

          if (fnErr) throw new Error(fnErr.message);

          const matchedClient = clients.find((c) => c.id === result?.matched_client_id);

          const nextStatus: UploadFile["status"] = result?.requires_review
            ? "needs_review"
            : result?.matched_client_id
              ? "matched"
              : "failed";

          workingFiles = workingFiles.map((f) =>
            f.id === current.id
              ? {
                  ...f,
                  status: nextStatus,
                  detected_document_type: result?.detected_document_type,
                  extracted_fields: result?.extracted_fields || {},
                  matched_client_id: result?.matched_client_id || null,
                  matched_client_name: matchedClient?.full_name || null,
                  confidence_score: result?.confidence_score,
                  match_status: nextStatus,
                  ai_reason: result?.match_reason || undefined,
                }
              : f,
          );

          setFiles([...workingFiles]);
          setBatch(recalcBatchFromFiles(workingFiles, batchId, "processing"));
        } catch (fnError: any) {
          workingFiles = workingFiles.map((f) =>
            f.id === current.id
              ? {
                  ...f,
                  status: "failed" as const,
                  ai_reason: fnError?.message || "Processing failed",
                }
              : f,
          );
          setFiles([...workingFiles]);
          setBatch(recalcBatchFromFiles(workingFiles, batchId, "processing"));
        }
      }

      const finalBatch = recalcBatchFromFiles(workingFiles, batchId, "completed");
      setBatch(finalBatch);

      await supabase
        .from("bulk_upload_batches" as any)
        .update({
          processed_files: finalBatch.processed_files,
          matched_files: finalBatch.matched_files,
          needs_review_count: finalBatch.needs_review_count,
          failed_files: finalBatch.failed_files,
          status: "completed",
        })
        .eq("id", batchId);

      toast({
        title: "Batch processing complete",
        description: `${queuedOrFailed.length} file${queuedOrFailed.length === 1 ? "" : "s"} processed`,
      });
    } catch (err: any) {
      toast({
        title: "Processing failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmMatch = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "ready_to_save" as const, match_status: "matched" } : f)),
    );
  };

  const bulkConfirmMatched = () => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.status === "matched" || (f.status === "needs_review" && (f.confidence_score || 0) >= 60)) {
          return { ...f, status: "ready_to_save" as const };
        }
        return f;
      }),
    );

    toast({
      title: "High-confidence matches confirmed",
      description: "Ready files can now be saved to client profiles.",
    });
  };

  const removeQueuedFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReviewSubmit = async () => {
    if (!reviewFile) return;

    const clientId = reassignClientId || reviewFile.matched_client_id;
    const client = clients.find((c) => c.id === clientId);
    const docType = overrideDocType || reviewFile.detected_document_type;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === reviewFile.id
          ? {
              ...f,
              status: "ready_to_save" as const,
              matched_client_id: clientId || null,
              matched_client_name: client?.full_name || f.matched_client_name || null,
              detected_document_type: docType,
            }
          : f,
      ),
    );

    if (reviewFile.db_file_id) {
      await supabase
        .from("document_match_reviews" as any)
        .update({
          admin_selected_client_id: clientId,
          review_status: clientId ? "confirmed" : "unmatched",
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
          notes: reviewNotes,
        })
        .eq("file_id", reviewFile.db_file_id);
    }

    setReviewFile(null);
    setReassignClientId("");
    setReviewNotes("");
    setOverrideDocType("");
  };

  const saveAllReady = async () => {
    const readyFiles = files.filter((f) => f.status === "ready_to_save" && f.matched_client_id);

    if (!readyFiles.length) {
      toast({
        title: "Nothing to save",
        description: "No files are ready to save yet.",
        variant: "destructive",
      });
      return;
    }

    setSavingBatch(true);
    let saved = 0;

    for (const f of readyFiles) {
      try {
        await supabase.from("client_documents").insert({
          user_id: f.matched_client_id!,
          document_type: f.detected_document_type || "other",
          file_name: f.file.name,
          file_path: f.storage_path,
          status: "verified",
          notes: `AI classified: ${DOC_TYPE_LABELS[f.detected_document_type || "other"]}. Confidence: ${
            f.confidence_score ?? "N/A"
          }%. ${f.ai_reason || ""}`,
          uploaded_at: new Date().toISOString(),
        });

        if (f.db_file_id) {
          await supabase
            .from("bulk_upload_files" as any)
            .update({ match_status: "saved" })
            .eq("id", f.dbFileId);
        }

        saved += 1;
        setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, status: "saved" as const } : p)));
      } catch (err) {
        console.error("Save error:", f.file.name, err);
      }
    }

    setSavingBatch(false);

    toast({
      title: "Batch saved",
      description: `${saved}/${readyFiles.length} file${readyFiles.length === 1 ? "" : "s"} saved to client profiles`,
    });
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  return (
    <div className="space-y-6">
      {batch && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Batch Progress
              </CardTitle>
              <Badge variant={batch.status === "completed" ? "default" : "secondary"}>{batch.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Total", value: batch.total_files, color: "text-foreground" },
                { label: "Processed", value: batch.processed_files, color: "text-blue-500" },
                { label: "Matched", value: batch.matched_files, color: "text-green-500" },
                { label: "Review", value: batch.needs_review_count, color: "text-orange-500" },
                { label: "Failed", value: batch.failed_files, color: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Bulk Document Intake
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={open}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Browse Files
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={processAllFiles}
              disabled={isProcessing || !files.some((f) => f.status === "queued" || f.status === "failed")}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Process Files
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFiles([]);
                setSelectedFiles(new Set());
                setBatch(null);
              }}
              disabled={!files.length || isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Queue
            </Button>
          </div>

          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">
              {isDragActive ? "Drop files here" : "Drag and drop client documents here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Supports PDF, JPG, JPEG, PNG, WEBP • Up to 20MB each</p>
            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={open}>
                Choose Files
              </Button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {files.length} file{files.length === 1 ? "" : "s"} in queue
            </div>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 flex-wrap">
            {(["all", "matched", "needs_review", "saved", "failed"] as FilterMode[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="text-xs"
              >
                {f === "all"
                  ? `All (${counts.all})`
                  : f === "needs_review"
                    ? `Review (${counts.needs_review})`
                    : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
              </Button>
            ))}
          </div>

          <div className="flex-1 min-w-[220px]">
            <Input
              placeholder="Search files, clients, doc types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {counts.matched > 0 && (
              <Button size="sm" variant="outline" onClick={bulkConfirmMatched}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Confirm All Matches
              </Button>
            )}

            {files.some((f) => f.status === "ready_to_save") && (
              <Button size="sm" onClick={saveAllReady} disabled={savingBatch}>
                {savingBatch ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save Ready ({files.filter((f) => f.status === "ready_to_save").length})
              </Button>
            )}
          </div>
        </div>
      )}

      {filteredFiles.length > 0 && (
        <Card>
          <CardContent className="pt-4 px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Doc Type</TableHead>
                    <TableHead>Matched Client</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
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
                          <div className="flex items-center gap-2 min-w-[180px]">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate max-w-[240px]">{f.file.name}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">{formatBytes(f.file.size)}</TableCell>

                        <TableCell>
                          <Badge className={cn("text-xs", sc.color)}>
                            <Icon className="h-3 w-3 mr-1" />
                            {sc.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm">
                          {DOC_TYPE_LABELS[f.detected_document_type || ""] || "—"}
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
                                "text-xs",
                                f.confidence_score >= 60
                                  ? "border-green-500 text-green-600"
                                  : f.confidence_score >= 30
                                    ? "border-orange-500 text-orange-600"
                                    : "border-destructive text-destructive",
                              )}
                            >
                              {Math.round(f.confidence_score)}%
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {f.status === "queued" && (
                              <Button size="sm" variant="outline" onClick={() => removeQueuedFile(f.id)}>
                                Remove
                              </Button>
                            )}

                            {f.status === "needs_review" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReviewFile(f);
                                  setReassignClientId(f.matched_client_id || "");
                                  setOverrideDocType(f.detected_document_type || "");
                                }}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Review
                              </Button>
                            )}

                            {f.status === "matched" && (
                              <Button size="sm" variant="outline" onClick={() => confirmMatch(f.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Confirm
                              </Button>
                            )}

                            {f.status === "failed" && (
                              <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                                {f.ai_reason || "Failed"}
                              </span>
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
                  <p className="font-medium break-all">{reviewFile.file.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Detected Type</p>
                  <p className="font-medium">{DOC_TYPE_LABELS[reviewFile.detected_document_type || ""] || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confidence</p>
                  <p className="font-medium">{Math.round(reviewFile.confidence_score || 0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium text-xs">{reviewFile.ai_reason || "N/A"}</p>
                </div>
              </div>

              {reviewFile.extracted_fields && Object.keys(reviewFile.extracted_fields).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Extracted Data</p>
                  <div className="bg-muted/50 rounded p-2 text-xs space-y-1">
                    {Object.entries(reviewFile.extracted_fields).map(([k, v]) =>
                      v ? (
                        <div key={k} className="flex justify-between gap-4">
                          <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                          <span className="font-medium text-right break-all">{String(v)}</span>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Override Document Type</p>
                <Select value={overrideDocType} onValueChange={setOverrideDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep detected type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Assign / Reassign Client</p>
                <Select value={reassignClientId} onValueChange={setReassignClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}
                        {c.email ? ` (${c.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Notes</p>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional review notes..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewFile(null)}>
              Cancel
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                if (!reviewFile) return;
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === reviewFile.id
                      ? { ...f, status: "failed" as const, ai_reason: "Marked unknown by admin" }
                      : f,
                  ),
                );
                setReviewFile(null);
              }}
            >
              Mark Unknown
            </Button>

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
