import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useFileUploadSecurity } from '@/hooks/useFileUploadSecurity';

interface AdminFileUploaderProps {
  clientId: string;
  onUploadComplete?: (fileUrl: string, category: string) => void;
}

export function AdminFileUploader({ clientId, onUploadComplete }: AdminFileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('');
  const { toast } = useToast();
  const { validateFile, sanitizeFileName } = useFileUploadSecurity();

  const categories = [
    'Driver\'s License',
    'Utility Bill', 
    'Lease Agreement',
    'Pay Stub',
    'SSN Card',
    'Credit Report - Experian',
    'Credit Report - Equifax',
    'Credit Report - TransUnion',
    'Dispute Letter',
    'Other Document'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast({
        title: 'File Validation Error',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const uploadFileToStorage = async (): Promise<string> => {
    if (!selectedFile || !clientId || !category) {
      throw new Error('Missing required upload data');
    }

    const fileExt = selectedFile.name.split('.').pop();
    const sanitizedName = sanitizeFileName(selectedFile.name);
    const fileName = `${Date.now()}-${sanitizedName}`;
    const categoryFolder = category.replace(/[^a-zA-Z0-9]/g, '_');
    const filePath = `${clientId}/${categoryFolder}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('client-documents')
      .getPublicUrl(filePath);

    return filePath;
  };

  const saveToDatabase = async (fileUrl: string) => {
    const documentData = {
      client_id: clientId,
      file_name: selectedFile!.name,
      file_url: fileUrl,
      file_type: selectedFile!.type,
      file_size: selectedFile!.size,
      category: category,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id || '',
      uploaded_at: new Date().toISOString()
    };

    // Choose the appropriate table based on category
    let tableName = 'documents';
    let insertData: any = documentData;

    if (category.includes('Credit Report')) {
      tableName = 'credit_reports';
      const bureau = category.split(' - ')[1];
      insertData = {
        client_id: clientId,
        bureau: bureau,
        uploaded_file_url: fileUrl,
        notes: `${bureau} credit report uploaded by admin`,
        fico_score: 650, // Default value, can be updated later
        user_id: documentData.uploaded_by
      };
    } else if (['Driver\'s License', 'Utility Bill', 'Lease Agreement', 'Pay Stub', 'SSN Card'].includes(category)) {
      tableName = 'identity_docs';
      insertData = {
        client_id: clientId,
        doc_type: category,
        uploaded_file_url: fileUrl
      };
    }

    const { error } = await supabase
      .from(tableName as any)
      .insert(insertData);

    if (error) {
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !category) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and category',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload to storage
      setUploadProgress(50);
      const fileUrl = await uploadFileToStorage();
      
      // Save to database
      setUploadProgress(80);
      await saveToDatabase(fileUrl);
      
      setUploadProgress(100);
      
      toast({
        title: 'Upload Successful',
        description: `${category} uploaded successfully`,
      });

      // Trigger autonomous processing if enabled
      try {
        const { data: settings } = await supabase
          .from('autonomous_settings' as any)
          .select('autonomous_enabled')
          .limit(1)
          .single();
        if ((settings as any)?.autonomous_enabled) {
          await supabase.functions.invoke('process-document-autonomous', {
            body: { document_id: fileUrl, file_url: fileUrl, file_name: selectedFile!.name, file_type: selectedFile!.type },
          });
        }
      } catch (autoErr) {
        console.log('Autonomous processing skipped:', autoErr);
      }

      // Reset form
      setSelectedFile(null);
      setCategory('');
      setUploadProgress(0);
      
      // Fire automation event
      try {
        await supabase.functions.invoke('process-automation-event', {
          body: { event_type: 'document_uploaded', client_id: clientId, payload: { category, file_name: selectedFile!.name }, source: 'admin_upload' },
        });
      } catch (autoErr) { console.log('Automation event skipped:', autoErr); }

      // Call completion callback
      onUploadComplete?.(fileUrl, category);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Client Document
        </CardTitle>
        <CardDescription>
          Upload documents securely to Supabase Storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="category">Document Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="file">Select File</Label>
          <Input
            id="file"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {selectedFile && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
            </div>
          )}
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-800">
            Files are stored securely in Supabase Storage with admin access control
          </p>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || !category || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </CardContent>
    </Card>
  );
}