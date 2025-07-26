import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NavigationHeader } from '@/components/NavigationHeader';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Eye, Trash2, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';

interface DocumentUpload {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  document_type: string;
  tag: string | null;
  ai_analysis_result: string | null;
  admin_status: string;
  upload_date: string;
}

const DOCUMENT_TYPES = [
  { value: 'drivers_license', label: 'Driver\'s License' },
  { value: 'social_security_card', label: 'Social Security Card' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'lease_agreement', label: 'Lease Agreement' },
  { value: 'pay_stub', label: 'Pay Stub' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'other', label: 'Other' },
];

const TAG_TYPES = [
  { value: 'id_verification', label: 'ID Verification' },
  { value: 'proof_of_address', label: 'Proof of Address' },
  { value: 'income_verification', label: 'Income Verification' },
  { value: 'other', label: 'Other' },
];

export function DocumentUploadCenter() {
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('document_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to upload documents');

      for (const file of acceptedFiles) {
        // Validate file type
        const allowedTypes = ['.pdf', '.jpg', '.png', '.jpeg', '.heic', '.docx'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
          toast({
            title: "Invalid File Type",
            description: `File ${file.name} is not an allowed type. Please upload: ${allowedTypes.join(', ')}`,
            variant: "destructive",
          });
          continue;
        }

        // Create file path: user_id/document_type/filename
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${user.id}/pending/${fileName}`;

        // Upload file to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('document-uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('document-uploads')
          .getPublicUrl(filePath);

        // Save document metadata to database
        const { data: documentData, error: dbError } = await supabase
          .from('document_uploads')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            file_type: file.type,
            document_type: 'other', // Will be updated by AI
            tag: null,
            ai_analysis_result: null,
            admin_status: 'pending'
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Trigger AI analysis
        try {
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-document', {
            body: {
              documentId: documentData.id,
              fileName: file.name
            }
          });

          if (analysisError) {
            console.error('AI analysis error:', analysisError);
          } else if (analysisData.success) {
            toast({
              title: "Upload Successful",
              description: `${file.name} uploaded and analyzed successfully`,
            });
          }
        } catch (analysisError) {
          console.error('AI analysis failed:', analysisError);
          toast({
            title: "Upload Successful",
            description: `${file.name} uploaded successfully (AI analysis unavailable)`,
          });
        }
      }

      await fetchDocuments();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload documents",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heic': ['.heic'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const updateDocumentTag = async (documentId: string, newTag: string) => {
    try {
      const { error } = await supabase
        .from('document_uploads')
        .update({ tag: newTag })
        .eq('id', documentId);

      if (error) throw error;

      await fetchDocuments();
      toast({
        title: "Success",
        description: "Document tag updated",
      });
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: "Error",
        description: "Failed to update document tag",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (document: DocumentUpload) => {
    try {
      // Delete from storage
      const filePath = document.file_url.split('/').slice(-3).join('/'); // Extract path from URL
      const { error: storageError } = await supabase.storage
        .from('document-uploads')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('document_uploads')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      await fetchDocuments();
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async (document: DocumentUpload) => {
    try {
      const filePath = document.file_url.split('/').slice(-3).join('/');
      const { data, error } = await supabase.storage
        .from('document-uploads')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'needs_review':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Needs Review</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getTagBadge = (tag: string | null) => {
    if (!tag) return <Badge variant="outline">Untagged</Badge>;
    
    const tagConfig = TAG_TYPES.find(t => t.value === tag);
    return <Badge variant="secondary">{tagConfig?.label || tag}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="text-center">Loading document center...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Document Upload Center</h1>
              <p className="text-muted-foreground mt-2">
                Upload sensitive ID documents for credit repair verification
              </p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Drag and drop files here or click to browse. Accepted formats: PDF, JPG, PNG, JPEG, HEIC, DOCX (Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              {uploading ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Uploading and analyzing documents...</p>
                </div>
              ) : isDragActive ? (
                <p className="text-lg font-medium">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">Drop documents here or click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    Supported: Driver's License, SSN Card, Utility Bills, Lease Agreements, Pay Stubs
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              Manage your uploaded verification documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload your first document using the form above.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>AI Analysis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.file_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={doc.tag || ''} onValueChange={(value) => updateDocumentTag(doc.id, value)}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select tag" />
                          </SelectTrigger>
                          <SelectContent>
                            {TAG_TYPES.map((tag) => (
                              <SelectItem key={tag.value} value={tag.value}>
                                {tag.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <p className="text-sm text-muted-foreground truncate">
                          {doc.ai_analysis_result || 'Analysis pending...'}
                        </p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(doc.admin_status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(doc.upload_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(doc)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteDocument(doc)}
                            className="flex items-center gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}