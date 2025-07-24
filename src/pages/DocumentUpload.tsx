import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Upload, FileText, Download, Trash2 } from 'lucide-react';

interface DisputeDoc {
  id: string;
  file_url: string;
  file_type: string;
  account_number: string | null;
  notes: string | null;
  created_at: string;
}

interface UploadFormData {
  file: File | null;
  file_type: string;
  account_number: string;
  notes: string;
}

const FILE_TYPES = [
  'ID',
  'Utility Bill', 
  'Credit Report',
  'Contract',
  'Other'
];

export function DocumentUpload() {
  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
    file_type: '',
    account_number: '',
    notes: '',
  });
  
  const [documents, setDocuments] = useState<DisputeDoc[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dispute_docs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleInputChange = (field: keyof Omit<UploadFormData, 'file'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('dispute-uploads')
      .upload(filePath, file);

    if (error) throw error;
    
    const { data } = supabase.storage
      .from('dispute-uploads')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.file_type) {
      toast({
        title: "Error",
        description: "Please select a file and file type",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to upload documents');

      // Upload file to storage
      const fileUrl = await uploadFile(formData.file);

      // Save document record
      const { error } = await supabase
        .from('dispute_docs')
        .insert({
          user_id: user.id,
          file_url: fileUrl,
          file_type: formData.file_type,
          account_number: formData.account_number || null,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document uploaded successfully!",
      });

      // Reset form
      setFormData({
        file: null,
        file_type: '',
        account_number: '',
        notes: '',
      });

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh documents list
      fetchDocuments();

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (docId: string, fileUrl: string) => {
    try {
      // Extract file path from URL for storage deletion
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // user_id/filename

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('dispute-uploads')
        .remove([filePath]);

      if (storageError) console.warn('Storage deletion error:', storageError);

      // Delete from database
      const { error } = await supabase
        .from('dispute_docs')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const getFileTypeBadge = (fileType: string) => {
    const colors: Record<string, string> = {
      'ID': 'bg-blue-100 text-blue-800',
      'Utility Bill': 'bg-green-100 text-green-800',
      'Credit Report': 'bg-purple-100 text-purple-800',
      'Contract': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    
    return (
      <Badge className={colors[fileType] || colors['Other']}>
        {fileType}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Document Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage your dispute-related documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New Document
            </CardTitle>
            <CardDescription>
              Upload documents related to your credit disputes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File *</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="w-full"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  {formData.file && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ {formData.file.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-type">Document Type *</Label>
                <Select value={formData.file_type} onValueChange={(value) => handleInputChange('file_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number">Related Account Number</Label>
                <Input
                  id="account-number"
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                  placeholder="Optional account number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Optional notes about this document"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isUploading} className="w-full">
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              Your uploaded dispute documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        {getFileTypeBadge(doc.file_type)}
                        {doc.account_number && (
                          <p className="text-sm text-muted-foreground">
                            Account: {doc.account_number}
                          </p>
                        )}
                        {doc.notes && (
                          <p className="text-sm text-muted-foreground">
                            {doc.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteDocument(doc.id, doc.file_url)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}