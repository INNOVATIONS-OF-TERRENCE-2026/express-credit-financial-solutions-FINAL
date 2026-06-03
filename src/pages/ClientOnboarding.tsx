import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, User, FileText, Home, X } from 'lucide-react';
import { useFileUploadSecurity } from '@/hooks/useFileUploadSecurity';
import { useAuditLog } from '@/hooks/useAuditLog';
import { sanitizeInput, validateEmail, validatePhone, validateSSN, validateName } from '@/utils/inputValidation';
import { encryptSSN } from '@/utils/ssnEncryption';
import { BackButton } from '@/components/BackButton';
import { useClientAgreement } from '@/hooks/useClientAgreement';
import { ClientAgreementModal } from '@/components/ClientAgreementModal';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ClientFormData {
  fullName: string;
  dateOfBirth: string;
  ssn: string;
  phoneNumber: string;
  emailAddress: string;
}

interface UploadedFiles {
  driversLicense: File | null;
  proofOfAddress: File | null;
  creditReports: File | null;
}

export function ClientOnboarding() {
  const [formData, setFormData] = useState<ClientFormData>({
    fullName: '',
    dateOfBirth: '',
    ssn: '',
    phoneNumber: '',
    emailAddress: '',
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    driversLicense: null,
    proofOfAddress: null,
    creditReports: null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [agreementOpen, setAgreementOpen] = useState(false);
  const { toast } = useToast();
  const { validateFile, sanitizeFileName } = useFileUploadSecurity();
  const { logFileUpload } = useAuditLog();
  const { hasSignedAgreement, loading: agreementLoading, refetchAgreementStatus } = useClientAgreement();
  const navigate = useNavigate();

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (field: keyof UploadedFiles, file: File | null) => {
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast({
          title: "File Validation Error",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
    }
    setUploadedFiles(prev => ({ ...prev, [field]: file }));
  };

  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  const handleSSNChange = (value: string) => {
    const formatted = formatSSN(value);
    handleInputChange('ssn', formatted);
  };

  const uploadFile = async (file: File, folder: string, fileName: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Sanitize file name
    const sanitizedFileName = sanitizeFileName(fileName);
    const filePath = `${user.id}/${folder}/${sanitizedFileName}`;
    
    const { error } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;
    
    // Log file upload
    await logFileUpload(sanitizedFileName, file.type, file.size);
    
    return filePath;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!validateName(formData.fullName)) {
      errors.fullName = 'Full name must be 2-50 characters and contain only letters, spaces, apostrophes, and hyphens';
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }

    if (!validateSSN(formData.ssn)) {
      errors.ssn = 'SSN must be in format XXX-XX-XXXX';
    }

    if (!validatePhone(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!validateEmail(formData.emailAddress)) {
      errors.emailAddress = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in to submit your information');
      }

      // Upload files
      const uploadPromises = [];
      let driversLicensePath = null;
      let proofOfAddressPath = null;
      let creditReportsPath = null;

      if (uploadedFiles.driversLicense) {
        uploadPromises.push(
          uploadFile(uploadedFiles.driversLicense, 'drivers-license', `license_${Date.now()}.pdf`)
            .then(path => { driversLicensePath = path; })
        );
      }

      if (uploadedFiles.proofOfAddress) {
        uploadPromises.push(
          uploadFile(uploadedFiles.proofOfAddress, 'proof-of-address', `address_${Date.now()}.pdf`)
            .then(path => { proofOfAddressPath = path; })
        );
      }

      if (uploadedFiles.creditReports) {
        uploadPromises.push(
          uploadFile(uploadedFiles.creditReports, 'credit-reports', `credit_${Date.now()}.pdf`)
            .then(path => { creditReportsPath = path; })
        );
      }

      await Promise.all(uploadPromises);

      // Encrypt SSN before storing
      const encryptedSSN = await encryptSSN(formData.ssn);

      // Save client data
      const { error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          dob: formData.dateOfBirth,
          ssn_last4: formData.ssn.slice(-4),
          phone: formData.phoneNumber,
          email: formData.emailAddress,
          address: 'Address to be updated',
          membership_plan: 'Basic'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your onboarding information has been submitted successfully!",
      });

      // Reset form
      setFormData({
        fullName: '',
        dateOfBirth: '',
        ssn: '',
        phoneNumber: '',
        emailAddress: '',
      });
      setUploadedFiles({
        driversLicense: null,
        proofOfAddress: null,
        creditReports: null,
      });

    } catch (error) {
      console.error('Error submitting onboarding:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit onboarding information",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUpload = ({ 
    label, 
    icon: Icon, 
    field, 
    acceptedTypes = ".pdf,.jpg,.jpeg,.png" 
  }: {
    label: string;
    icon: any;
    field: keyof UploadedFiles;
    acceptedTypes?: string;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </Label>
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
        <input
          type="file"
          accept={acceptedTypes}
          onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
          className="hidden"
          id={field}
        />
        <label htmlFor={field} className="cursor-pointer">
          {uploadedFiles[field] ? (
            <div className="text-sm text-green-600">
              ✓ {uploadedFiles[field]!.name}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              Click to upload or drag and drop
            </div>
          )}
        </label>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <BackButton />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Client Onboarding</h1>
          <p className="text-muted-foreground mt-2">
            Please provide your information to get started with Express Credit & Financial Solutions
          </p>
        </div>
      </div>

      {/* Complete Your Client Agreement Section */}
      <Card className="mb-8 relative">
        {/* Floating Exit Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => navigate('/')}
                className="absolute top-4 right-4 z-10 w-10 h-10 p-0 rounded-full bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-midnight-bg shadow-neon-gold hover:shadow-neon-gold transition-all duration-300 hover:scale-110"
                aria-label="Exit Sign Agreement Page"
              >
                <X className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exit & Return to Dashboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <CardHeader>
          <CardTitle className="text-center text-2xl pr-12">Complete Your Client Agreement</CardTitle>
          <CardDescription className="text-center">
            Please review and sign the client agreement to proceed with onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasSignedAgreement ? (
            <div className="border-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg text-center space-y-4">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                Review the Express Credit & Financial Solutions service agreement, then draw or type your signature to activate your account.
              </p>
              <Button
                type="button"
                size="lg"
                onClick={() => setAgreementOpen(true)}
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
              >
                Review & Sign Agreement
              </Button>
            </div>
          ) : (
            <div className="border-2 border-green-500/50 bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ Agreement Signed
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  You have full access to all credit building tools and services.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientAgreementModal
        isOpen={agreementOpen}
        onClose={() => setAgreementOpen(false)}
        onAgreementSigned={() => { setAgreementOpen(false); refetchAgreementStatus(); }}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Please provide your basic personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={validationErrors.dateOfBirth ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.dateOfBirth && (
                  <p className="text-sm text-red-500">{validationErrors.dateOfBirth}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ssn">Social Security Number *</Label>
                <Input
                  id="ssn"
                  type="text"
                  value={formData.ssn}
                  onChange={(e) => handleSSNChange(e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  className={validationErrors.ssn ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.ssn && (
                  <p className="text-sm text-red-500">{validationErrors.ssn}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="(555) 123-4567"
                  className={validationErrors.phoneNumber ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.phoneNumber && (
                  <p className="text-sm text-red-500">{validationErrors.phoneNumber}</p>
                )}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emailAddress">Email Address *</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  placeholder="your.email@example.com"
                  className={validationErrors.emailAddress ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.emailAddress && (
                  <p className="text-sm text-red-500">{validationErrors.emailAddress}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Required Documents
            </CardTitle>
            <CardDescription>
              Please upload the following documents to verify your identity and address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FileUpload 
                label="Upload Driver's License or ID"
                icon={User}
                field="driversLicense"
              />
              
              <FileUpload 
                label="Upload Proof of Address"
                icon={Home}
                field="proofOfAddress"
              />
              
              <FileUpload 
                label="Upload Credit Reports"
                icon={FileText}
                field="creditReports"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="px-8"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Onboarding Information'}
          </Button>
        </div>
      </form>
    </div>
  );
}