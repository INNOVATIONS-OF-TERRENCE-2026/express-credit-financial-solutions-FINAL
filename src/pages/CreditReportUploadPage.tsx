import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Upload, FileText, Trash2, Eye, Info, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFileUploadSecurity } from '@/hooks/useFileUploadSecurity';
import { useAuditLog } from '@/hooks/useAuditLog';
import { sanitizeInput } from '@/utils/inputValidation';

interface CreditReport {
  id: string;
  file_path: string;
  uploaded_at: string;
  doc_type: string;
  report_source: string;
  notes: string | null;
  full_name: string;
}

interface UploadFormData {
  fullName: string;
  file: File | null;
  reportSource: string;
  notes: string;
}

const REPORT_SOURCES = [
  'IdentityIQ',
  'SmartCredit',
  'Experian',
  'Credit Karma',
  'Other'
];

export function CreditReportUploadPage() {
  const [formData, setFormData] = useState<UploadFormData>({
    fullName: '',
    file: null,
    reportSource: '',
    notes: ''
  });
  
  const [creditReports, setCreditReports] = useState<CreditReport[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { validateFile, sanitizeFileName } = useFileUploadSecurity();
  const { logFileUpload, logFileDelete } = useAuditLog();

  const fetchCreditReports = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('doc_type', 'Credit Report')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match our interface
      const mappedReports = (data || []).map(doc => ({
        id: doc.id,
        file_path: doc.file_path,
        uploaded_at: doc.uploaded_at,
        doc_type: doc.doc_type,
        report_source: 'Credit Report', // Default for existing records
        notes: null, // Default for existing records
        full_name: user.email || 'User' // Default fallback
      }));
      
      setCreditReports(mappedReports);
    } catch (error) {
      console.error('Error fetching credit reports:', error);
      toast({
        title: "Error",
        description: "Failed to load credit reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCreditReports();
    
    // Auto-fill user's name if logged in
    if (user?.email) {
      setFormData(prev => ({ 
        ...prev, 
        fullName: user.user_metadata?.full_name || user.email 
      }));
    }
  }, [fetchCreditReports, user]);

  const handleInputChange = (field: keyof Omit<UploadFormData, 'file'>, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast({
          title: "File Validation Error",
          description: validation.error,
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, file }));
    
    if (validationErrors.file) {
      setValidationErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.file) {
      errors.file = 'Please select a credit report file';
    }

    if (!formData.reportSource) {
      errors.reportSource = 'Please select the report source';
    }

    if (formData.notes && formData.notes.length > 500) {
      errors.notes = 'Notes must be less than 500 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const sanitizedFileName = sanitizeFileName(file.name);
    const fileName = `credit_report_${Date.now()}_${sanitizedFileName}`;
    const filePath = `${user.id}/credit-reports/${fileName}`;
    
    // Simulate progress for user feedback
    setUploadProgress(10);
    
    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;
    
    setUploadProgress(80);
    
    // Log file upload
    await logFileUpload(fileName, file.type, file.size);
    
    setUploadProgress(100);
    
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to upload credit reports');

      // Upload file to storage
      const filePath = await uploadFile(formData.file!);

      // Save document record
      const { error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_path: filePath,
          doc_type: 'Credit Report'
        });

      if (error) throw error;

      // Send notification email to admin
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            to: 'expresscreditfinancialsolution@gmail.com',
            subject: 'New Credit Report Uploaded',
            html: `
              <h2>New Credit Report Upload</h2>
              <p><strong>User:</strong> ${formData.fullName}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Report Source:</strong> ${formData.reportSource}</p>
              <p><strong>Upload Date:</strong> ${new Date().toLocaleString()}</p>
              ${formData.notes ? `<p><strong>Notes:</strong> ${formData.notes}</p>` : ''}
            `
          }
        });
      } catch (emailError) {
        console.warn('Failed to send notification email:', emailError);
        // Don't fail the upload if email fails
      }

      toast({
        title: "Success",
        description: "Credit report uploaded successfully! We'll analyze it and contact you with next steps.",
      });

      // Reset form
      setFormData({
        fullName: user.user_metadata?.full_name || user.email || '',
        file: null,
        reportSource: '',
        notes: ''
      });

      // Reset file input
      const fileInput = document.getElementById('credit-report-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh reports list
      fetchCreditReports();

    } catch (error) {
      console.error('Error uploading credit report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload credit report",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteReport = async (reportId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) console.warn('Storage deletion error:', storageError);

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Log file deletion
      await logFileDelete(reportId, filePath.split('/').pop() || '');

      toast({
        title: "Success",
        description: "Credit report deleted successfully",
      });

      fetchCreditReports();
    } catch (error) {
      console.error('Error deleting credit report:', error);
      toast({
        title: "Error",
        description: "Failed to delete credit report",
        variant: "destructive",
      });
    }
  };

  const previewReport = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        throw new Error('Failed to generate preview link');
      }
    } catch (error) {
      console.error('Error previewing report:', error);
      toast({
        title: "Error",
        description: "Failed to preview credit report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-b-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your credit reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Your Credit Report</h1>
          <p className="text-muted-foreground">
            Upload a recent copy of your credit report so we can analyze it and generate dispute letters for inaccurate items.
          </p>
        </div>

        {/* Instruction Box */}
        <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-primary mb-2">Instructions</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a recent copy of your credit report from SmartCredit, IdentityIQ, Credit Karma, or any 3-bureau report. 
                  This allows us to analyze your report and generate dispute letters for inaccurate items.
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Need help downloading your credit report?</span>{' '}
                  <button 
                    className="text-primary hover:underline"
                    onClick={() => toast({
                      title: "Credit Report Help",
                      description: "Contact us at expresscreditfinancialsolution@gmail.com for assistance downloading your credit report.",
                    })}
                  >
                    Click here for instructions
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Credit Report
              </CardTitle>
              <CardDescription>
                All documents are encrypted and stored securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className={validationErrors.fullName ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.fullName && (
                    <p className="text-sm text-red-500">{validationErrors.fullName}</p>
                  )}
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="credit-report-file">Select File *</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input
                      id="credit-report-file"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="credit-report-file" className="cursor-pointer">
                      {formData.file ? (
                        <div className="text-sm text-green-600">
                          <FileText className="h-8 w-8 mx-auto mb-2" />
                          ✓ {formData.file.name}
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, JPG, PNG files accepted
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  {validationErrors.file && (
                    <p className="text-sm text-red-500">{validationErrors.file}</p>
                  )}
                </div>

                {/* Report Source */}
                <div className="space-y-2">
                  <Label htmlFor="reportSource">Report Source *</Label>
                  <Select value={formData.reportSource} onValueChange={(value) => handleInputChange('reportSource', value)}>
                    <SelectTrigger className={validationErrors.reportSource ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select report source" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.reportSource && (
                    <p className="text-sm text-red-500">{validationErrors.reportSource}</p>
                  )}
                </div>

                {/* Optional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Optional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional comments about your credit report"
                    className={validationErrors.notes ? 'border-red-500' : ''}
                    rows={3}
                    maxLength={500}
                  />
                  {validationErrors.notes && (
                    <p className="text-sm text-red-500">{validationErrors.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.notes.length}/500 characters
                  </p>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? 'Uploading...' : 'Upload Now'}
                </Button>
              </form>

              {/* Security Disclaimer */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Security Notice:</strong> All documents are encrypted and stored securely. 
                      Only our authorized staff can access your files for credit analysis purposes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Previously Uploaded Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Previously Uploaded Reports
              </CardTitle>
              <CardDescription>
                View and manage your uploaded credit reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {creditReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No credit reports uploaded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your first credit report to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {creditReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <Badge variant="secondary">Credit Report</Badge>
                          <p className="text-sm font-medium">{report.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {new Date(report.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => previewReport(report.file_path)}
                            title="Preview Report"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteReport(report.id, report.file_path)}
                            title="Delete Report"
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