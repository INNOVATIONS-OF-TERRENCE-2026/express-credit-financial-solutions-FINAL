import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateUploadFile, formatFileSize, getSupportedAcceptTypes } from '@/lib/documentUtils';

interface FileUploaderProps {
  clientId: string;
  docType: string;
  bucket: string;
  onUploadComplete: (url: string) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

export function FileUploader({
  clientId,
  docType,
  bucket,
  onUploadComplete,
  maxFileSize = 20 * 1024 * 1024
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: getSupportedAcceptTypes(),
    maxSize: maxFileSize,
    onDrop: handleFileDrop,
    multiple: false,
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors?.[0]?.message || 'File rejected';
      toast({ title: 'File rejected', description: msg, variant: 'destructive' });
    },
  });

  async function handleFileDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const validation = validateUploadFile(file);
    if (!validation.valid) {
      toast({ title: 'File validation failed', description: validation.error, variant: 'destructive' });
      return;
    }

    setUploadedFile(file);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const sanitizedType = docType.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${clientId}/${sanitizedType}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      onUploadComplete(fileName);
      toast({ title: 'Upload successful', description: `${docType} has been uploaded successfully.` });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error?.message || 'There was an error uploading your file. Please try again.',
        variant: 'destructive',
      });
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  }

  if (uploadedFile) {
    return (
      <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-5 h-5 text-green-600" />
              <div>
                <span className="text-sm font-medium text-green-800 dark:text-green-300">{uploadedFile.name}</span>
                <p className="text-xs text-green-600">{formatFileSize(uploadedFile.size)}</p>
              </div>
            </div>
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)} className="text-green-600 hover:text-green-800">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {uploading && (
            <div className="mt-2">
              <div className="w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-1/2 animate-pulse" />
              </div>
              <p className="text-xs text-green-600 mt-1">Uploading...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors">
      <CardContent className="p-6">
        <div {...getRootProps()} className={`text-center cursor-pointer ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}>
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-4" />
          <p className="text-sm font-medium mb-2">{docType}</p>
          {isDragActive ? (
            <p className="text-sm">Drop the file here...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm">Drag & drop or click to select</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WEBP, DOC, CSV (max {Math.round(maxFileSize / 1024 / 1024)}MB)</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
