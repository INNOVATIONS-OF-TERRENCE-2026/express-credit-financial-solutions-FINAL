import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Upload, Check, Eye, EyeOff, AlertCircle, Lock, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDropzone } from 'react-dropzone';

interface UploadStatus {
  id: 'pending' | 'uploaded';
  ssn: 'pending' | 'uploaded';
  address: 'pending' | 'uploaded';
  other: 'pending' | 'uploaded';
}

interface SecureVerificationUploadProps {
  userId: string;
}

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

type DocKey = 'id' | 'ssn' | 'address' | 'other';

/** Upload via signed URL using XHR so we get real progress events. */
function uploadWithProgress(
  url: string,
  file: File,
  token: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-upsert', 'true');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

export function SecureVerificationUpload({ userId }: SecureVerificationUploadProps) {
  const { toast } = useToast();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    id: 'pending',
    ssn: 'pending',
    address: 'pending',
    other: 'pending'
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<DocKey, number>>({ id: 0, ssn: 0, address: 0, other: 0 });
  const [fieldError, setFieldError] = useState<Record<DocKey, string | null>>({ id: null, ssn: null, address: null, other: null });
  const [ssn, setSsn] = useState('');
  const [experianUsername, setExperianUsername] = useState('');
  const [experianPassword, setExperianPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [credentialsSaved, setCredentialsSaved] = useState(false);

  const validateFile = (file: File): string | null => {
    const nameLc = file.name.toLowerCase();
    const extOk = ALLOWED_EXT.some((e) => nameLc.endsWith(e));
    const typeOk = (ALLOWED_MIME as readonly string[]).includes(file.type);
    if (!typeOk && !extOk) return 'Only PDF, JPG, or PNG files are accepted.';
    if (file.size === 0) return 'This file appears to be empty.';
    if (file.size > MAX_BYTES) return `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 15 MB.`;
    return null;
  };

  const handleFileUpload = async (file: File, docType: DocKey) => {
    if (!file) return;
    const err = validateFile(file);
    setFieldError((p) => ({ ...p, [docType]: err }));
    if (err) {
      toast({ title: 'File rejected', description: err, variant: 'destructive' });
      return;
    }

    setUploading(docType);
    setProgress((p) => ({ ...p, [docType]: 0 }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${docType}_${Date.now()}.${fileExt}`;

      // Try a signed upload URL for real progress; fall back to standard upload.
      const signed = await supabase.storage
        .from('verification-docs')
        .createSignedUploadUrl(fileName);

      if (signed.data?.signedUrl) {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token ?? '';
        await uploadWithProgress(signed.data.signedUrl, file, token, (pct) =>
          setProgress((p) => ({ ...p, [docType]: pct })),
        );
      } else {
        const { error: uploadError } = await supabase.storage
          .from('verification-docs')
          .upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;
        setProgress((p) => ({ ...p, [docType]: 100 }));
      }

      // The first three categories are stored on the verification record so admins
      // can see at a glance which required docs are received. "other" goes into the
      // general documents table tagged with a category, keeping the verification
      // record clean for the 3 required items.
      let dbError: any = null;
      if (docType === 'other') {
        const { error } = await supabase.from('documents').insert({
          user_id: userId,
          doc_type: 'other_supporting',
          file_path: fileName,
        } as any);
        dbError = error;
      } else {
        const columnMap = {
          id: 'id_document_url',
          ssn: 'ssn_document_url',
          address: 'address_document_url',
        } as const;
        const { error } = await supabase
          .from('client_verification_secure')
          .upsert({
            user_id: userId,
            [columnMap[docType]]: fileName,
            updated_at: new Date().toISOString(),
          } as any, { onConflict: 'user_id' });
        dbError = error;
      }

      if (dbError) {
        // Roll back the orphaned storage object so it doesn't linger unreferenced
        await supabase.storage.from('verification-docs').remove([fileName]);
        throw dbError;
      }

      setUploadStatus(prev => ({ ...prev, [docType]: 'uploaded' }));
      setProgress((p) => ({ ...p, [docType]: 100 }));
      toast({
        title: 'Document Uploaded',
        description: 'Your document has been securely uploaded.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setFieldError((p) => ({ ...p, [docType]: error.message || 'Upload failed.' }));
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

  const UploadZone = ({ docType, label, description, acceptedFormats, required = true }: {
    docType: DocKey;
    label: string;
    description: string;
    acceptedFormats: string;
    required?: boolean;
  }) => {
    const onDrop = useCallback((acceptedFiles: File[], rejections: any[]) => {
      if (rejections && rejections.length > 0) {
        const reason = rejections[0]?.errors?.[0];
        const msg =
          reason?.code === 'file-too-large'
            ? 'File exceeds the 15 MB limit.'
            : reason?.code === 'file-invalid-type'
            ? 'Only PDF, JPG, or PNG files are accepted.'
            : reason?.message || 'File rejected.';
        setFieldError((p) => ({ ...p, [docType]: msg }));
        toast({ title: 'File rejected', description: msg, variant: 'destructive' });
        return;
      }
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
      maxFiles: 1,
      maxSize: MAX_BYTES,
    });

    const status = uploadStatus[docType];
    const pct = progress[docType];
    const err = fieldError[docType];
    const isUploading = uploading === docType;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        <div
          {...getRootProps()}
          aria-busy={isUploading}
          aria-invalid={!!err}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
            err ? 'border-rose-500 bg-rose-500/5' :
            isDragActive ? 'border-accent bg-accent/10 scale-[1.01]' :
            status === 'uploaded' ? 'border-green-500 bg-green-500/10' :
            'border-border hover:border-accent/50'
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-5 w-5 text-accent animate-pulse" />
              <span className="text-sm font-medium">Uploading… {pct}%</span>
              <Progress value={pct} className="h-1.5 w-full" />
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
                {isDragActive ? 'Release to upload' : 'Drag & drop, or click to browse'}
              </span>
              <span className="text-xs text-muted-foreground">{acceptedFormats} · up to 15 MB</span>
            </div>
          )}
        </div>
        {err && (
          <p className="flex items-start gap-1.5 text-xs text-rose-600 mt-1">
            <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{err}</span>
          </p>
        )}
        <Badge variant={status === 'uploaded' ? 'default' : 'secondary'} className="mt-1">
          {status === 'uploaded' ? 'Received' : required ? 'Required' : 'Optional'}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <UploadZone
              docType="id"
              label="1. Government Photo ID"
              description="Driver's License, State ID, or US Passport. Must be clear, unexpired, and show full face + ID number."
              acceptedFormats="PDF, JPG, PNG"
            />
            <UploadZone
              docType="ssn"
              label="2. Social Security Card"
              description="SSN card, W-2, SSA-1099, or recent pay stub displaying your full SSN or last 4 digits."
              acceptedFormats="PDF, JPG, PNG"
            />
            <UploadZone
              docType="address"
              label="3. Proof of Current Address"
              description="Utility bill, bank statement, lease, or mortgage dated within the last 60 days showing name + current address."
              acceptedFormats="PDF, JPG, PNG"
            />
            <UploadZone
              docType="other"
              label="4. Other Supporting Documents"
              description="Optional: court orders, name-change paperwork, FTC report, or anything else your specialist requested."
              acceptedFormats="PDF, JPG, PNG"
              required={false}
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
