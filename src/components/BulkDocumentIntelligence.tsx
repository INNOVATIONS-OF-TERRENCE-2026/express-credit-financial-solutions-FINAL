import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, FolderOpen } from "lucide-react";

interface UploadFile {
  id: string;
  file: File;
  status: "queued" | "uploading" | "uploaded" | "failed";
  storage_path?: string;
  db_file_id?: string;
  error?: string;
}

export function BulkDocumentIntelligence() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔥 FILE UPLOAD HANDLER
  const uploadFiles = async (fileList: File[]) => {
    if (!user?.id) {
      toast({
        title: "Not signed in",
        description: "You must be signed in.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    for (const file of fileList) {
      const fileId = crypto.randomUUID();
      const storagePath = `bulk-uploads/${user.id}/${Date.now()}-${file.name}`;

      setFiles((prev) => [...prev, { id: fileId, file, status: "uploading" }]);

      try {
        // ✅ STORAGE UPLOAD
        const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file);

        if (uploadError) {
          console.error("STORAGE UPLOAD ERROR:", uploadError);
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // ✅ DB RECORD
        const { data, error: dbError } = await supabase
          .from("bulk_upload_files" as any)
          .insert({
            file_name: file.name,
            storage_path: storagePath,
            file_type: file.type,
            match_status: "pending",
          })
          .select()
          .single();

        if (dbError) {
          console.error("DB INSERT ERROR:", dbError);
          throw new Error(`DB insert failed: ${dbError.message}`);
        }

        const db_file_id = (data as any)?.id;

        // ✅ UPDATE STATE
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "uploaded",
                  storage_path: storagePath,
                  db_file_id,
                }
              : f,
          ),
        );

        // 🔥 READY FOR AI PIPELINE
        await supabase.functions.invoke("bulk-document-intelligence-processor", {
          body: {
            file_id: db_file_id,
            file_name: file.name,
            batch_id: null,
          },
        });
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "failed",
                  error: err.message,
                }
              : f,
          ),
        );

        toast({
          title: "Upload failed",
          description: err.message,
          variant: "destructive",
        });
      }
    }

    setLoading(false);
  };

  // 🔥 FILE INPUT HANDLER
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await uploadFiles(Array.from(e.target.files));
  };

  // 🔥 DRAG & DROP
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: uploadFiles,
    multiple: true,
    noClick: true,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Document Upload</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 🔥 BUTTON */}
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          <div className="flex gap-3">
            <Button onClick={() => document.getElementById("file-upload")?.click()}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>

            <Button variant="outline" onClick={open}>
              <Upload className="h-4 w-4 mr-2" />
              Open Dropzone
            </Button>
          </div>

          {/* 🔥 DROPZONE */}
          <div {...getRootProps()} className="border-2 border-dashed p-10 rounded-xl text-center cursor-pointer">
            <input {...getInputProps()} />

            {isDragActive ? (
              <p className="text-green-400">Drop files here...</p>
            ) : (
              <p>Drag & drop files here OR use upload button</p>
            )}
          </div>

          {/* 🔥 FILE LIST */}
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex justify-between items-center border p-2 rounded">
                <span>{f.file.name}</span>

                <span className="text-sm">
                  {f.status === "uploading" && <Loader2 className="animate-spin h-4 w-4" />}
                  {f.status === "uploaded" && "✅"}
                  {f.status === "failed" && "❌"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
