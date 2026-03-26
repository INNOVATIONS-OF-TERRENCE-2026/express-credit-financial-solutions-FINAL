import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, FolderOpen, CheckCircle2, XCircle, Trash2, FileText } from "lucide-react";
import { validateUploadFile, formatFileSize, getSupportedAcceptTypes, getSupportedExtensions } from "@/lib/documentUtils";

interface UploadFile {
  id: string;
  file: File;
  status: "queued" | "uploading" | "uploaded" | "failed";
  storage_path?: string;
  db_file_id?: string;
  error?: string;
  errorSource?: "validation" | "storage" | "database" | "ai_pipeline";
}

export function BulkDocumentIntelligence() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [processing, setProcessing] = useState(false);

  const uploadFiles = useCallback(async (fileList: File[]) => {
    if (!user?.id) {
      toast({ title: "Not signed in", description: "You must be signed in to upload.", variant: "destructive" });
      return;
    }

    // Validate all files first
    const validFiles: File[] = [];
    for (const file of fileList) {
      const validation = validateUploadFile(file);
      if (!validation.valid) {
        const fileId = crypto.randomUUID();
        setFiles(prev => [...prev, { id: fileId, file, status: "failed", error: validation.error, errorSource: "validation" }]);
        toast({ title: `Rejected: ${file.name}`, description: validation.error, variant: "destructive" });
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    setProcessing(true);

    // Create batch first
    let batchId: string | null = null;
    if (validFiles.length > 1) {
      try {
        const { data: batchData, error: batchError } = await supabase
          .from("bulk_upload_batches" as any)
          .insert({
            created_by: user.id,
            total_files: validFiles.length,
            status: "uploading",
          })
          .select()
          .single();

        if (batchError) {
          console.error("BATCH CREATE ERROR:", batchError);
        } else {
          batchId = (batchData as any)?.id || null;
        }
      } catch (err) {
        console.error("Batch creation failed, continuing without batch:", err);
      }
    }

    for (const file of validFiles) {
      const fileId = crypto.randomUUID();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `bulk-uploads/${user.id}/${Date.now()}-${sanitizedName}`;

      setFiles(prev => [...prev, { id: fileId, file, status: "uploading" }]);

      try {
        // Step 1: Storage upload
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          throw { message: `Storage: ${uploadError.message}`, source: "storage" as const };
        }

        // Step 2: DB record (batch_id is now nullable)
        const insertPayload: any = {
          file_name: file.name,
          storage_path: storagePath,
          file_type: file.type,
          match_status: "pending",
        };
        if (batchId) insertPayload.batch_id = batchId;

        const { data, error: dbError } = await supabase
          .from("bulk_upload_files" as any)
          .insert(insertPayload)
          .select()
          .single();

        if (dbError) {
          throw { message: `Database: ${dbError.message}`, source: "database" as const };
        }

        const db_file_id = (data as any)?.id;

        // Step 3: Update success state
        setFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, status: "uploaded" as const, storage_path: storagePath, db_file_id } : f)
        );

        // Step 4: Trigger AI pipeline (non-blocking)
        supabase.functions.invoke("bulk-document-intelligence-processor", {
          body: { file_id: db_file_id, file_name: file.name, batch_id: batchId },
        }).catch(aiErr => {
          console.warn("AI pipeline trigger skipped:", aiErr);
        });

      } catch (err: any) {
        const errorSource = err?.source || "storage";
        const errorMessage = err?.message || String(err);

        setFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, status: "failed" as const, error: errorMessage, errorSource } : f)
        );

        toast({ title: `Upload failed: ${file.name}`, description: errorMessage, variant: "destructive" });
      }
    }

    // Update batch status if created
    if (batchId) {
      const uploaded = files.filter(f => f.status === "uploaded").length + validFiles.length;
      await supabase.from("bulk_upload_batches" as any).update({ status: "processing" } as any).eq("id", batchId);
    }

    setProcessing(false);
    toast({ title: "Upload complete", description: `${validFiles.length} file(s) processed` });
  }, [user, toast, files]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await uploadFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== "uploaded" && f.status !== "failed"));
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: uploadFiles,
    multiple: true,
    noClick: true,
    accept: getSupportedAcceptTypes(),
  });

  const uploadedCount = files.filter(f => f.status === "uploaded").length;
  const failedCount = files.filter(f => f.status === "failed").length;
  const uploadingCount = files.filter(f => f.status === "uploading").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Document Intelligence
          </CardTitle>
          <CardDescription>
            Upload client documents for AI-powered classification, client matching, and workflow automation.
            Supports: PDF, JPG, PNG, WEBP, TXT, DOC, DOCX, CSV (max 20MB each)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Action buttons */}
          <input
            type="file"
            id="bulk-file-upload"
            multiple
            accept={getSupportedExtensions()}
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => document.getElementById("bulk-file-upload")?.click()} disabled={processing}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
            <Button variant="outline" onClick={open} disabled={processing}>
              <Upload className="h-4 w-4 mr-2" />
              Open Dropzone
            </Button>
            {files.length > 0 && (
              <Button variant="ghost" onClick={clearCompleted} size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Completed
              </Button>
            )}
          </div>

          {/* Status summary */}
          {files.length > 0 && (
            <div className="flex gap-3 text-sm">
              {uploadedCount > 0 && <Badge variant="default" className="bg-green-600">{uploadedCount} uploaded</Badge>}
              {failedCount > 0 && <Badge variant="destructive">{failedCount} failed</Badge>}
              {uploadingCount > 0 && <Badge variant="secondary">{uploadingCount} uploading</Badge>}
            </div>
          )}

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
            {isDragActive ? (
              <p className="text-primary font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="font-medium">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground mt-1">or use the Upload Documents button above</p>
              </div>
            )}
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center justify-between border rounded-lg p-3 ${
                    f.status === "uploaded" ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800" :
                    f.status === "failed" ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800" :
                    "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{f.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(f.file.size)}</p>
                      {f.error && <p className="text-xs text-destructive mt-1">{f.error}</p>}
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {f.status === "uploading" && <Loader2 className="animate-spin h-5 w-5 text-primary" />}
                    {f.status === "uploaded" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    {f.status === "failed" && <XCircle className="h-5 w-5 text-destructive" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
