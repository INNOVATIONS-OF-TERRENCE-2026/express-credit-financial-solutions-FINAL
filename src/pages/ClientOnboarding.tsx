import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, User, FileText, Home } from 'lucide-react';

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
  const { toast } = useToast();

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof UploadedFiles, file: File | null) => {
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

    const filePath = `${user.id}/${folder}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Save client data
      const { error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth,
          ssn: formData.ssn,
          phone_number: formData.phoneNumber,
          email_address: formData.emailAddress,
          drivers_license_path: driversLicensePath,
          proof_of_address_path: proofOfAddressPath,
          credit_reports_path: creditReportsPath,
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
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Client Onboarding</h1>
        <p className="text-muted-foreground mt-2">
          Please provide your information to get started with Express Credit & Financial Solutions
        </p>
      </div>

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
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  required
                />
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
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emailAddress">Email Address *</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
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