import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Upload, Check, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDropzone } from 'react-dropzone';

interface UploadStatus {
  id: 'pending' | 'uploaded';
  ssn: 'pending' | 'uploaded';
  address: 'pending' | 'uploaded';
}

interface SecureVerificationUploadProps {
  userId: string;
}

export function SecureVerificationUpload({ userId }: SecureVerificationUploadProps) {
  const { toast } = useToast();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    id: 'pending',
    ssn: 'pending',
    address: 'pending'
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [ssn, setSsn] = useState('');
  const [experianUsername, setExperianUsername] = useState('');
  const [experianPassword, setExperianPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [credentialsSaved, setCredentialsSaved] = useState(false);

  const handleFileUpload = async (file: File, docType: 'id' | 'ssn' | 'address') => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload PDF, JPG, or PNG files only.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(docType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${docType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-docs')
        .getPublicUrl(fileName);

      // Update verification record
      const columnMap = {
        id: 'id_document_url',
        ssn: 'ssn_document_url',
        address: 'address_document_url'
      };

      const { error: dbError } = await supabase
        .from('client_verification_secure')
        .upsert({
          user_id: userId,
          [columnMap[docType]]: fileName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (dbError) {
        // Roll back the orphaned storage object so it doesn't linger unreferenced
        await supabase.storage.from('verification-docs').remove([fileName]);
        throw dbError;
      }

      setUploadStatus(prev => ({ ...prev, [docType]: 'uploaded' }));
      toast({
        title: 'Document Uploaded',
        description: 'Your document has been securely uploaded.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document.',
        variant: 'destructive'
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSaveCredentials = async () => {
    if (!ssn || !experianUsername || !experianPassword) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Encrypt credentials using the database function
      const { data: encryptedSSN } = await supabase.rpc('encrypt_ssn_secure', { ssn_text: ssn });
      
      const { error } = await supabase
        .from('client_verification_secure')
        .upsert({
          user_id: userId,
          ssn_encrypted: encryptedSSN,
          experian_username_encrypted: btoa(experianUsername), // Base64 encode for transit
          experian_password_encrypted: btoa(experianPassword), // Base64 encode for transit
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setCredentialsSaved(true);
      setSsn('');
      setExperianUsername('');
      setExperianPassword('');
      
      toast({
        title: 'Credentials Saved Securely',
        description: 'Your information has been encrypted and saved.',
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save credentials.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const UploadZone = ({ docType, label, description, acceptedFormats }: {
    docType: 'id' | 'ssn' | 'address';
    label: string;
    description: string;
    acceptedFormats: string;
  }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        handleFileUpload(acceptedFiles[0], docType);
      }
    }, [docType]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png']
      },
      maxFiles: 1
    });

    const status = uploadStatus[docType];

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-accent bg-accent/10' : 
            status === 'uploaded' ? 'border-green-500 bg-green-500/10' : 
            'border-border hover:border-accent/50'
          }`}
        >
          <input {...getInputProps()} />
          {uploading === docType ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
              <span className="text-sm">Uploading...</span>
            </div>
          ) : status === 'uploaded' ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="text-sm font-medium">Uploaded</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isDragActive ? 'Drop file here' : 'Click or drag to upload'}
              </span>
              <span className="text-xs text-muted-foreground">{acceptedFormats}</span>
            </div>
          )}
        </div>
        <Badge variant={status === 'uploaded' ? 'default' : 'secondary'} className="mt-1">
          {status === 'uploaded' ? 'Complete' : 'Required'}
        </Badge>
      </div>
    );
  };

  const allDocsUploaded = uploadStatus.id === 'uploaded' && 
                          uploadStatus.ssn === 'uploaded' && 
                          uploadStatus.address === 'uploaded';

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-accent" />
          <CardTitle>Required Client Verification & Authorization</CardTitle>
        </div>
        <CardDescription>
          To begin processing, please upload the required verification documents below. All files are encrypted and securely stored.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Upload Section */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Document Upload (All 3 Required)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UploadZone
              docType="id"
              label="Government-Issued Photo ID"
              description="Driver's License or State ID"
              acceptedFormats="PDF, JPG, PNG"
            />
            <UploadZone
              docType="ssn"
              label="Proof of Social Security"
              description="SSN Card, W-2, 1099, SSA-1099, or Pay Stub (showing last 4)"
              acceptedFormats="PDF, JPG, PNG"
            />
            <UploadZone
              docType="address"
              label="Proof of Current Address"
              description="Utility Bill, Bank Statement, or Lease/Mortgage"
              acceptedFormats="PDF, JPG, PNG"
            />
          </div>
        </div>

        {/* Secure Input Section */}
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Secure Client Authorization
          </h4>
          <p className="text-sm text-muted-foreground">
            Certain account-level actions require authorized access information. Your credentials are encrypted and never shared outside your case.
          </p>

          {credentialsSaved ? (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-600 font-medium">Credentials saved securely</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ssn">Full Social Security Number</Label>
                <Input
                  id="ssn"
                  type="password"
                  placeholder="XXX-XX-XXXX"
                  value={ssn}
                  onChange={(e) => setSsn(e.target.value)}
                  autoComplete="off"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experian-user">Experian Username</Label>
                <Input
                  id="experian-user"
                  type="text"
                  placeholder="Your Experian username"
                  value={experianUsername}
                  onChange={(e) => setExperianUsername(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experian-pass">Experian Password</Label>
                <div className="relative">
                  <Input
                    id="experian-pass"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your Experian password"
                    value={experianPassword}
                    onChange={(e) => setExperianPassword(e.target.value)}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!credentialsSaved && (
            <Button 
              onClick={handleSaveCredentials} 
              disabled={saving || !ssn || !experianUsername || !experianPassword}
              className="w-full md:w-auto"
            >
              {saving ? 'Saving...' : 'Save Securely'}
            </Button>
          )}
        </div>

        {/* Status Summary */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {allDocsUploaded && credentialsSaved 
                ? 'All verification complete. Your case is ready for processing.'
                : 'Please complete all required uploads and fields to begin processing.'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
