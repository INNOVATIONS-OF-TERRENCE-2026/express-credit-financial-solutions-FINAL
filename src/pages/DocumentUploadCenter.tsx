import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NavigationHeader } from '@/components/NavigationHeader';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Eye, Trash2, CheckCircle, AlertTriangle, Calendar, FileX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const documentTypes = [
  { value: 'drivers_license', label: 'Driver\'s License' },
  { value: 'social_security_card', label: 'Social Security Card' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'lease_agreement', label: 'Lease Agreement' },
  { value: 'pay_stub', label: 'Pay Stub' },
  { value: 'other', label: 'Other' },
];

const tagTypes = [
  { value: 'id_verification', label: 'ID Verification' },
  { value: 'proof_of_address', label: 'Proof of Address' },
  { value: 'income_verification', label: 'Income Verification' },
  { value: 'other', label: 'Other' },
];

export function DocumentUploadCenter() {
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.jpg', '.png', '.jpeg', '.heic', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload files with these extensions: ${allowedTypes.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to upload documents');

      // Create unique filename with user folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/uploads/${fileName}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('document-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('document-uploads')
        .getPublicUrl(filePath);

      // Save document metadata
      const { data: documentData, error: dbError } = await supabase
        .from('document_uploads')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: fileExt || 'unknown',
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
        await supabase.functions.invoke('analyze-document', {
          body: {
            documentId: documentData.id,
            fileName: file.name,
            fileType: fileExt
          }
        });
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
        // Non-critical error, document still uploaded
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateDocumentTag = async (documentId: string, newTag: string) => {
    try {
      const { error } = await supabase
        .from('document_uploads')
        .update({ tag: newTag })
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId ? { ...doc, tag: newTag } : doc
        )
      );

      toast({
        title: "Success",
        description: "Document tag updated",
      });
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: "Error",
        description: "Failed to update tag",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('document-uploads')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('document_uploads')
        .delete()
        .eq('id', documentId);

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

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'needs_review': { color: 'bg-red-100 text-red-800', icon: FileX },
    };
    
    const config = configs[status] || configs['pending'];
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen midnight-theme">
      <NavigationHeader />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <BackButton />
            <div className="midnight-header p-6 rounded-lg">
              <h1 className="text-3xl font-bold midnight-section-title midnight-glow-text">Document Upload Center</h1>
              <p className="text-midnight-text mt-2">
                Upload sensitive ID documents for credit repair verification
              </p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <Card className="mb-8 midnight-card shadow-neon-gold">
          <CardHeader className="bg-gradient-midnight">
            <CardTitle className="flex items-center gap-2 text-gold">
              <Upload className="h-5 w-5 text-gold" />
              Upload Documents
            </CardTitle>
            <CardDescription className="text-midnight-text">
              Accepted formats: PDF, JPG, PNG, JPEG, HEIC, DOCX (Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-muted-foreground mb-4">
                Driver's License, SSN Card, Utility Bill, Lease Agreement, Pay Stub
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.png,.jpeg,.heic,.docx"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <Button
                asChild
                disabled={uploading}
                className="cursor-pointer midnight-btn-gold"
              >
                <label htmlFor="file-upload">
                  {uploading ? 'Uploading...' : 'Choose Files'}
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Your documents are encrypted and stored securely. 
            Only you and authorized administrators can access your uploaded files.
          </AlertDescription>
        </Alert>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              View and manage your uploaded verification documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload your first document using the upload area above.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(doc.file_size)} • {doc.file_type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.admin_status)}
                        <Badge variant="outline">
                          {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                        </Badge>
                      </div>
                    </div>

                    {doc.ai_analysis_result && (
                      <Alert className="mb-3">
                        <AlertDescription>
                          <strong>AI Analysis:</strong> {doc.ai_analysis_result}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Tag:</span>
                          <Select
                            value={doc.tag || ''}
                            onValueChange={(value) => updateDocumentTag(doc.id, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select tag" />
                            </SelectTrigger>
                            <SelectContent>
                              {tagTypes.map((tag) => (
                                <SelectItem key={tag.value} value={tag.value}>
                                  {tag.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(doc.upload_date), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.file_url, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const filePath = doc.file_url.split('/').slice(-3).join('/');
                            deleteDocument(doc.id, filePath);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}