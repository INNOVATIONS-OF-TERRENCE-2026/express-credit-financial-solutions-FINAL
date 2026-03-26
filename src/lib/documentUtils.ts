import { supabase } from "@/integrations/supabase/client";

// Bucket mapping by document category
const BUCKET_MAP: Record<string, string> = {
  "Driver's License": "client-documents",
  "Utility Bill": "client-documents",
  "Lease Agreement": "client-documents",
  "Lease": "client-documents",
  "Pay Stub": "client-documents",
  "SSN Card": "client-documents",
  "Credit Report - Experian": "client-documents",
  "Credit Report - Equifax": "client-documents",
  "Credit Report - TransUnion": "client-documents",
  "Dispute Letter": "client-documents",
  "Other Document": "client-documents",
  "identity_docs": "client-documents",
  "credit_reports": "client-documents",
  "bulk_upload": "documents",
  "document_uploads": "document-uploads",
};

export function getDocumentBucket(category: string): string {
  return BUCKET_MAP[category] || "client-documents";
}

export async function getSignedDownloadUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!path) return null;

  // If it's already a full URL, return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error(`Signed URL error [${bucket}/${path}]:`, error.message);
    return null;
  }

  return data?.signedUrl || null;
}

export async function previewFile(bucket: string, path: string): Promise<void> {
  const url = await getSignedDownloadUrl(bucket, path);
  if (url) {
    window.open(url, "_blank");
  } else {
    throw new Error("Could not generate preview URL");
  }
}

export async function downloadFile(
  bucket: string,
  path: string,
  filename?: string
): Promise<void> {
  const url = await getSignedDownloadUrl(bucket, path);
  if (!url) throw new Error("Could not generate download URL");

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || path.split("/").pop() || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: open signed URL directly
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || path.split("/").pop() || "download";
    link.target = "_blank";
    link.click();
  }
}

// File validation
const SUPPORTED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
  const allExts = Object.values(SUPPORTED_TYPES).flat();

  if (!allExts.includes(ext)) {
    return { valid: false, error: `Unsupported file type: ${ext}. Supported: ${allExts.join(", ")}` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 20MB` };
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getSupportedAcceptTypes(): Record<string, string[]> {
  return { ...SUPPORTED_TYPES };
}

export function getSupportedExtensions(): string {
  return Object.values(SUPPORTED_TYPES).flat().join(",");
}
