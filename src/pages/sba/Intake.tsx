import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { SectionTitle } from '@/components/sba/SectionTitle';
import { FormRow } from '@/components/sba/FormRow';
import { useAppStore } from '@/store/app';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ApplicationCreate, Owner } from '@/types';

const borrowerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

const businessSchema = z.object({
  legal_name: z.string().min(1, 'Legal business name is required'),
  dba_name: z.string().optional(),
  ein: z.string().regex(/^\d{2}-?\d{7}$/, 'Valid EIN required (XX-XXXXXXX)'),
  naics: z.string().min(1, 'NAICS code is required'),
  years_in_business: z.number().min(0, 'Years in business must be 0 or greater'),
  website: z.string().url('Valid URL required').optional().or(z.literal('')),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postal_code: z.string().min(5, 'Valid postal code required'),
});

const loanSchema = z.object({
  program: z.enum(['7a', '504', 'microloan', 'express']),
  requested_amount: z.number().min(1000, 'Minimum loan amount is $1,000'),
  use_of_funds: z.string().min(1, 'Use of funds is required'),
});

const ownerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  percent_ownership: z.number().min(20, 'Must own at least 20%').max(100, 'Cannot exceed 100%'),
  ssn_last4: z.string().regex(/^\d{4}$/, 'Last 4 digits of SSN required'),
});

const STEPS = [
  { id: 'borrower', title: 'Borrower Information', description: 'Your personal details' },
  { id: 'business', title: 'Business Information', description: 'Company details and address' },
  { id: 'loan', title: 'Loan Request', description: 'Amount and use of funds' },
  { id: 'owners', title: 'Ownership Information', description: 'All owners with 20%+ stake' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function Intake() {
  const navigate = useNavigate();
  const { matchedProgram, setApplicationData, setStatus } = useAppStore();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form states
  const [borrowerData, setBorrowerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  const [businessData, setBusinessData] = useState({
    legal_name: '',
    dba_name: '',
    ein: '',
    naics: '',
    years_in_business: 0,
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
  });

  const [loanData, setLoanData] = useState({
    program: matchedProgram || '7a' as const,
    requested_amount: 0,
    use_of_funds: '',
  });

  const [owners, setOwners] = useState<Owner[]>([{
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    percent_ownership: 0,
    ssn_last4: '',
  }]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];

  const addOwner = () => {
    setOwners([...owners, {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      percent_ownership: 0,
      ssn_last4: '',
    }]);
  };

  const removeOwner = (index: number) => {
    if (owners.length > 1) {
      setOwners(owners.filter((_, i) => i !== index));
    }
  };

  const updateOwner = (index: number, field: keyof Owner, value: string | number) => {
    const updated = [...owners];
    updated[index] = { ...updated[index], [field]: value };
    setOwners(updated);
  };

  const validateCurrentStep = () => {
    try {
      switch (currentStep) {
        case 0:
          borrowerSchema.parse(borrowerData);
          return true;
        case 1:
          businessSchema.parse(businessData);
          return true;
        case 2:
          loanSchema.parse(loanData);
          return true;
        case 3:
          owners.forEach(owner => ownerSchema.parse(owner));
          const totalOwnership = owners.reduce((sum, owner) => sum + (owner.percent_ownership || 0), 0);
          if (totalOwnership < 51) {
            throw new Error('Total ownership must be at least 51%');
          }
          return true;
        default:
          return false;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else if (error instanceof Error) {
        toast({
          title: 'Validation Error',
          description: error.message,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit application
      setLoading(true);
      try {
        const applicationData: ApplicationCreate = {
          borrower: borrowerData,
          business: businessData,
          program: loanData.program,
          requested_amount: loanData.requested_amount,
          use_of_funds: loanData.use_of_funds,
          owners: owners,
        };

        const result = await apiClient.createApplication(applicationData);
        
        setApplicationData({
          applicationId: result.application_id,
          borrowerId: result.borrower_id,
          businessId: result.business_id,
        });
        
        setStatus('docs');
        
        toast({
          title: 'Application Created',
          description: 'Your application has been saved successfully.',
        });
        
        navigate('/sba/documents');
      } catch (error) {
        console.error('Application creation error:', error);
        toast({
          title: 'Error',
          description: 'Failed to create application. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/sba/consent');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <FormRow>
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-slate-300">First Name *</Label>
                <Input
                  id="first_name"
                  value={borrowerData.first_name}
                  onChange={(e) => setBorrowerData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-slate-300">Last Name *</Label>
                <Input
                  id="last_name"
                  value={borrowerData.last_name}
                  onChange={(e) => setBorrowerData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </FormRow>
            <FormRow>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={borrowerData.email}
                  onChange={(e) => setBorrowerData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={borrowerData.phone}
                  onChange={(e) => setBorrowerData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </FormRow>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <FormRow>
              <div className="space-y-2">
                <Label htmlFor="legal_name" className="text-slate-300">Legal Business Name *</Label>
                <Input
                  id="legal_name"
                  value={businessData.legal_name}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, legal_name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dba_name" className="text-slate-300">DBA Name (if different)</Label>
                <Input
                  id="dba_name"
                  value={businessData.dba_name}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, dba_name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </FormRow>
            <FormRow>
              <div className="space-y-2">
                <Label htmlFor="ein" className="text-slate-300">Federal EIN *</Label>
                <Input
                  id="ein"
                  placeholder="XX-XXXXXXX"
                  value={businessData.ein}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, ein: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="naics" className="text-slate-300">NAICS Code *</Label>
                <Input
                  id="naics"
                  placeholder="6-digit code"
                  value={businessData.naics}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, naics: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </FormRow>
            <FormRow>
              <div className="space-y-2">
                <Label htmlFor="years_in_business" className="text-slate-300">Years in Business *</Label>
                <Input
                  id="years_in_business"
                  type="number"
                  min="0"
                  value={businessData.years_in_business}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, years_in_business: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-slate-300">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={businessData.website}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, website: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </FormRow>
            <div className="space-y-2">
              <Label htmlFor="address_line1" className="text-slate-300">Business Address *</Label>
              <Input
                id="address_line1"
                placeholder="Street address"
                value={businessData.address_line1}
                onChange={(e) => setBusinessData(prev => ({ ...prev, address_line1: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Apt, suite, etc. (optional)"
                value={businessData.address_line2}
                onChange={(e) => setBusinessData(prev => ({ ...prev, address_line2: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <FormRow columns={3}>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-slate-300">City *</Label>
                <Input
                  id="city"
                  value={businessData.city}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, city: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-slate-300">State *</Label>
                <Select value={businessData.state} onValueChange={(value) => setBusinessData(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state} className="text-white">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-slate-300">ZIP Code *</Label>
                <Input
                  id="postal_code"
                  value={businessData.postal_code}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, postal_code: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </FormRow>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormRow>
              <div className="space-y-2">
                <Label htmlFor="program" className="text-slate-300">SBA Program *</Label>
                <Select value={loanData.program} onValueChange={(value: any) => setLoanData(prev => ({ ...prev, program: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="7a" className="text-white">SBA 7(a)</SelectItem>
                    <SelectItem value="504" className="text-white">SBA 504</SelectItem>
                    <SelectItem value="microloan" className="text-white">Microloan</SelectItem>
                    <SelectItem value="express" className="text-white">SBA Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requested_amount" className="text-slate-300">Requested Amount *</Label>
                <Input
                  id="requested_amount"
                  type="number"
                  min="1000"
                  placeholder="$50,000"
                  value={loanData.requested_amount}
                  onChange={(e) => setLoanData(prev => ({ ...prev, requested_amount: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </FormRow>
            <div className="space-y-2">
              <Label htmlFor="use_of_funds" className="text-slate-300">Use of Funds *</Label>
              <Textarea
                id="use_of_funds"
                placeholder="Describe how you will use the loan funds..."
                value={loanData.use_of_funds}
                onChange={(e) => setLoanData(prev => ({ ...prev, use_of_funds: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-slate-400">
                List all owners with 20% or more ownership stake
              </p>
              <Button onClick={addOwner} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Owner
              </Button>
            </div>
            
            {owners.map((owner, index) => (
              <Card key={index} className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-white">Owner {index + 1}</CardTitle>
                    {owners.length > 1 && (
                      <Button
                        onClick={() => removeOwner(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormRow>
                    <div className="space-y-2">
                      <Label className="text-slate-300">First Name *</Label>
                      <Input
                        value={owner.first_name}
                        onChange={(e) => updateOwner(index, 'first_name', e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Last Name *</Label>
                      <Input
                        value={owner.last_name}
                        onChange={(e) => updateOwner(index, 'last_name', e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </FormRow>
                  <FormRow>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Email *</Label>
                      <Input
                        type="email"
                        value={owner.email}
                        onChange={(e) => updateOwner(index, 'email', e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Phone</Label>
                      <Input
                        type="tel"
                        value={owner.phone || ''}
                        onChange={(e) => updateOwner(index, 'phone', e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </FormRow>
                  <FormRow>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Ownership % *</Label>
                      <Input
                        type="number"
                        min="20"
                        max="100"
                        value={owner.percent_ownership}
                        onChange={(e) => updateOwner(index, 'percent_ownership', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Last 4 SSN *</Label>
                      <Input
                        maxLength={4}
                        placeholder="XXXX"
                        value={owner.ssn_last4 || ''}
                        onChange={(e) => updateOwner(index, 'ssn_last4', e.target.value.replace(/\D/g, ''))}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </FormRow>
                </CardContent>
              </Card>
            ))}

            <div className="text-sm text-slate-400">
              <p>Total Ownership: {owners.reduce((sum, owner) => sum + (owner.percent_ownership || 0), 0)}%</p>
              <p className="mt-1">Note: Total ownership must be at least 51%</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <SectionTitle subtitle="Complete your SBA loan application with detailed business information">
            Loan Application Intake
          </SectionTitle>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Step {currentStep + 1} of {STEPS.length}: {currentStepData.title}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              {currentStepData.title}
            </CardTitle>
            <p className="text-slate-400">{currentStepData.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStepContent()}

            <div className="flex justify-between pt-6 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="border-slate-600 text-slate-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {currentStep === 0 ? 'Back to Consent' : 'Previous'}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Creating Application...' : (currentStep === STEPS.length - 1 ? 'Create Application' : 'Next')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}