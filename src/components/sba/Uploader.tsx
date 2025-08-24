import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadedDoc {
  doc_type: string;
  filename: string;
  url?: string;
}

interface UploaderProps {
  applicationId: string;
  onUploaded?: (doc: UploadedDoc) => void;
}

interface FileUpload {
  id: string;
  file: File;
  doc_type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

const DOC_TYPES = [
  { value: 'tax_return', label: 'Tax Return' },
  { value: 'pnl', label: 'Profit & Loss Statement' },
  { value: 'balance_sheet', label: 'Balance Sheet' },
  { value: 'license', label: 'Business License' },
  { value: 'id', label: 'ID Document' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'other', label: 'Other' },
];

export function Uploader({ applicationId, onUploaded }: UploaderProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [defaultDocType, setDefaultDocType] = useState('tax_return');
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      doc_type: defaultDocType,
      progress: 0,
      status: 'pending' as const,
    }));
    
    setUploads(prev => [...prev, ...newUploads]);
  }, [defaultDocType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const updateUpload = (id: string, updates: Partial<FileUpload>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    ));
  };

  const uploadFile = async (upload: FileUpload) => {
    if (!upload.doc_type) {
      updateUpload(upload.id, { 
        status: 'error', 
        error: 'Please select a document type' 
      });
      return;
    }

    updateUpload(upload.id, { status: 'uploading', progress: 0 });

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        updateUpload(upload.id, {
          progress: Math.min((uploads.find(u => u.id === upload.id)?.progress || 0) + 10, 90)
        });
      }, 200);

      const result = await apiClient.uploadDocument(
        applicationId,
        upload.doc_type,
        upload.file
      );

      clearInterval(progressInterval);
      
      updateUpload(upload.id, {
        status: 'success',
        progress: 100,
        url: result.url,
      });

      const docData = {
        doc_type: upload.doc_type,
        filename: upload.file.name,
        url: result.url,
      };

      onUploaded?.(docData);
      
      toast({
        title: "Upload Successful",
        description: `${upload.file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      updateUpload(upload.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${upload.file.name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const updateDocType = (id: string, doc_type: string) => {
    updateUpload(id, { doc_type });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Doc Type Selector */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Default Document Type</label>
          <Select value={defaultDocType} onValueChange={setDefaultDocType}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {DOC_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value} className="text-white">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-green-500 bg-green-500/10" 
              : "border-slate-600 hover:border-slate-500 bg-slate-700/30"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-300 mb-2">
            {isDragActive 
              ? 'Drop files here...' 
              : 'Drag & drop files here, or click to select'
            }
          </p>
          <p className="text-sm text-slate-500">
            Supports: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
          </p>
        </div>

        {/* Upload List */}
        {uploads.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Files to Upload</h3>
            {uploads.map(upload => (
              <div key={upload.id} className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-white">{upload.file.name}</p>
                      <p className="text-sm text-slate-400">
                        {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {upload.status === 'success' && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Check className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                    {upload.status === 'error' && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUpload(upload.id)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <Select 
                      value={upload.doc_type} 
                      onValueChange={(value) => updateDocType(upload.id, value)}
                      disabled={upload.status === 'uploading' || upload.status === 'success'}
                    >
                      <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {DOC_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value} className="text-white">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={() => uploadFile(upload)}
                    disabled={
                      upload.status === 'uploading' || 
                      upload.status === 'success' || 
                      !upload.doc_type
                    }
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {upload.status === 'uploading' ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>

                {upload.status === 'uploading' && (
                  <Progress value={upload.progress} className="mb-2" />
                )}

                {upload.error && (
                  <p className="text-sm text-red-400 mt-2">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}