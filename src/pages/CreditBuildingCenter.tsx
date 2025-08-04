import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, ExternalLink, CreditCard, Users, Building, GraduationCap, TrendingUp, Star, Shield, Award } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClientAgreement } from '@/hooks/useClientAgreement';
import { ClientAgreementModal } from '@/components/ClientAgreementModal';
import { AURequestModal } from '@/components/AURequestModal';
import { ConsultationModal } from '@/components/ConsultationModal';
import { DigitalSignature } from '@/components/DigitalSignature';
import { PlaidBankLink } from '@/components/PlaidBankLink';
import { BackButton } from '@/components/BackButton';
import { NavigationHeader } from '@/components/NavigationHeader';

export default function CreditBuildingCenter() {
  const [expandedSection, setExpandedSection] = useState<string | null>('education');
  const [appliedTradelines, setAppliedTradelines] = useState<string[]>([]);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showAUModal, setShowAUModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedTradelineId, setSelectedTradelineId] = useState<string | undefined>();
  
  const { hasSignedAgreement, loading: agreementLoading, refetchAgreementStatus } = useClientAgreement();

  const progressSteps = [
    { id: 'disputes', label: 'Disputes Completed', completed: true },
    { id: 'freeze', label: 'Freeze Finished', completed: true },
    { id: 'tradelines', label: 'Tradelines Added', completed: false },
    { id: 'au-slots', label: 'AU Slot Added', completed: false },
    { id: 'monitoring', label: 'Score Monitoring', completed: false },
  ];

  const completedSteps = progressSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / progressSteps.length) * 100;

  const primaryTradelines = [
    {
      id: 'opensky',
      name: 'OpenSky® Secured Visa',
      deposit: '$200 minimum',
      reportTime: '30-45 days',
      bureaus: 'All 3 Bureaus',
      link: 'https://www.opensky.com',
      description: 'No credit check required, ideal for rebuilding'
    },
    {
      id: 'chime',
      name: 'Chime Credit Builder',
      deposit: '$0 minimum',
      reportTime: '30 days',
      bureaus: 'All 3 Bureaus',
      link: 'https://www.chime.com',
      description: 'Secured card that builds credit with no fees'
    },
    {
      id: 'self',
      name: 'Self Credit Builder Loan',
      deposit: '$25/month',
      reportTime: '30 days',
      bureaus: 'All 3 Bureaus',
      link: 'https://www.self.inc',
      description: 'Build credit while saving money'
    },
    {
      id: 'creditstrong',
      name: 'CreditStrong Revolv',
      deposit: '$99 setup',
      reportTime: '30 days',
      bureaus: 'All 3 Bureaus',
      link: 'https://www.creditstrong.com',
      description: 'Hybrid credit building account'
    }
  ];

  const auTradelines = [
    {
      id: 'au1',
      accountAge: '15 years',
      creditLimit: '$25,000',
      utilization: '5%',
      price: '$899',
      available: true
    },
    {
      id: 'au2',
      accountAge: '12 years',
      creditLimit: '$15,000',
      utilization: '3%',
      price: '$699',
      available: true
    },
    {
      id: 'au3',
      accountAge: '8 years',
      creditLimit: '$10,000',
      utilization: '2%',
      price: '$499',
      available: false
    }
  ];

  const businessTradelines = [
    {
      name: 'Uline',
      type: 'Net 30',
      bureaus: 'D&B, Experian Biz',
      description: 'Industrial supplies and equipment',
      link: 'https://www.uline.com'
    },
    {
      name: 'Grainger',
      type: 'Net 30',
      bureaus: 'D&B, Experian Biz',
      description: 'Maintenance, repair & operations',
      link: 'https://www.grainger.com'
    },
    {
      name: 'NAV',
      type: 'Credit Line',
      bureaus: 'All Business Bureaus',
      description: 'Business credit building platform',
      link: 'https://www.nav.com'
    }
  ];

  const toggleApplied = (tradelineId: string) => {
    setAppliedTradelines(prev => 
      prev.includes(tradelineId) 
        ? prev.filter(id => id !== tradelineId)
        : [...prev, tradelineId]
    );
  };

  const handleAURequest = (tradelineId?: string) => {
    if (!hasSignedAgreement) {
      setShowAgreementModal(true);
      return;
    }
    setSelectedTradelineId(tradelineId);
    setShowAUModal(true);
  };

  const handleScheduleConsultation = () => {
    if (!hasSignedAgreement) {
      setShowAgreementModal(true);
      return;
    }
    setShowConsultationModal(true);
  };

  // Show loading state while checking agreement status
  if (agreementLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-b-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your credit building center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen midnight-theme">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Bank Account Connection */}
        {hasSignedAgreement && (
          <Card className="mb-8">
            <CardContent className="py-6">
              <PlaidBankLink />
            </CardContent>
          </Card>
        )}

        {/* Header Section */}
        <div className="text-center mb-12 midnight-header p-8 rounded-lg">
          <div className="flex items-center justify-center mb-4">
            <Award className="h-12 w-12 text-gold mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold midnight-section-title midnight-glow-text">
              Credit Building Center
            </h1>
          </div>
          <p className="text-xl text-midnight-text max-w-3xl mx-auto leading-relaxed">
            Transform your financial future with strategic credit building after dispute completion
          </p>
          <Badge variant="secondary" className="mt-4 px-6 py-2 text-lg midnight-btn-gold">
            <Shield className="h-4 w-4 mr-2" />
            {hasSignedAgreement ? 'Full Access Granted' : 'Agreement Required'}
          </Badge>
        </div>

        {/* Progress Tracker */}
        <Card className="mb-8 midnight-card shadow-neon-gold">
          <CardHeader className="bg-gradient-midnight">
            <CardTitle className="flex items-center text-2xl text-gold">
              <TrendingUp className="h-6 w-6 mr-3 text-gold" />
              Your Credit Building Progress
            </CardTitle>
            <CardDescription className="text-lg text-midnight-text">
              Track your journey to excellent credit
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-bold text-primary">{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {progressSteps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
                  {step.completed ? (
                    <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  ) : (
                    <Circle className="h-8 w-8 text-muted-foreground mb-2" />
                  )}
                  <span className="text-sm font-medium">{step.label}</span>
                  {index < progressSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-0.5 bg-border"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Educational Section */}
        <Card className="mb-8 border-2 border-accent/20 shadow-xl">
          <CardHeader 
            className="cursor-pointer bg-gradient-to-r from-accent/5 to-primary/5"
            onClick={() => setExpandedSection(expandedSection === 'education' ? null : 'education')}
          >
            <CardTitle className="flex items-center justify-between text-2xl">
              <div className="flex items-center">
                <GraduationCap className="h-6 w-6 mr-3 text-accent" />
                How to Rebuild and Grow Your Credit After Disputes
              </div>
              <Badge variant="outline">Click to {expandedSection === 'education' ? 'collapse' : 'expand'}</Badge>
            </CardTitle>
          </CardHeader>
          {expandedSection === 'education' && (
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6 text-lg leading-relaxed">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-3">
                      🎉 Congratulations on Your Success!
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      You've taken a major step by removing inaccurate or negative items from your credit report. 
                      But credit repair is only <strong>half the journey</strong> — now it's time to <strong>rebuild and grow</strong> your credit.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-primary">What Are Tradelines?</h3>
                    <p className="mb-4">
                      A <strong>tradeline</strong> is any account that shows up on your credit report — credit cards, loans, or utilities.
                      Adding positive accounts helps increase your credit score, build trust with lenders, and unlock approvals for cars, homes, and funding.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-card border border-border rounded-lg p-6">
                        <h4 className="text-xl font-semibold mb-3 text-primary">Primary Tradelines</h4>
                        <p className="text-muted-foreground">
                          Secured cards, credit builder loans, or accounts opened in your name. 
                          These build your credit history directly.
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-6">
                        <h4 className="text-xl font-semibold mb-3 text-accent">Authorized User (AU) Tradelines</h4>
                        <p className="text-muted-foreground">
                          You're added to an aged account to benefit from its positive history, 
                          instantly boosting your credit age and limits.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 rounded-lg border">
                    <h4 className="text-xl font-semibold mb-3">Expected Timeline</h4>
                    <ul className="space-y-2">
                      <li><strong>Days 10-30:</strong> New tradelines begin reporting</li>
                      <li><strong>Days 30-45:</strong> Score improvements become visible</li>
                      <li><strong>Days 45-60:</strong> Maximum score impact achieved</li>
                      <li><strong>Ongoing:</strong> Consistent positive reporting builds long-term credit strength</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>

        {/* Primary Tradelines Section */}
        <Card className="mb-8 border-2 border-primary/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="flex items-center text-2xl">
              <CreditCard className="h-6 w-6 mr-3 text-primary" />
              Primary Tradelines Recommendations
            </CardTitle>
            <CardDescription className="text-lg">
              Build credit with accounts in your name
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {primaryTradelines.map((tradeline) => (
                <div key={tradeline.id} className="border border-border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{tradeline.name}</h3>
                    <Badge variant={appliedTradelines.includes(tradeline.id) ? "default" : "outline"}>
                      {appliedTradelines.includes(tradeline.id) ? 'Applied' : 'Available'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{tradeline.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Minimum Deposit:</span>
                      <span>{tradeline.deposit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Report Time:</span>
                      <span>{tradeline.reportTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Reports To:</span>
                      <span>{tradeline.bureaus}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(tradeline.link, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                    <Button 
                      variant={appliedTradelines.includes(tradeline.id) ? "default" : "secondary"}
                      size="sm"
                      onClick={() => toggleApplied(tradeline.id)}
                    >
                      {appliedTradelines.includes(tradeline.id) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Authorized User Marketplace */}
        <Card className="mb-8 border-2 border-accent/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10">
            <CardTitle className="flex items-center text-2xl">
              <Users className="h-6 w-6 mr-3 text-accent" />
              Authorized User Marketplace
            </CardTitle>
            <CardDescription className="text-lg">
              Instantly boost your credit with aged accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border">
              <p className="text-lg">
                <strong>AU Benefits:</strong> Inherit the account's age, credit limit, and perfect payment history. 
                This can significantly boost your credit score within 30-45 days.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {auTradelines.map((au) => (
                <div key={au.id} className={`border-2 rounded-lg p-6 ${au.available ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant={au.available ? "default" : "destructive"}>
                      {au.available ? 'Available' : 'Sold Out'}
                    </Badge>
                    <span className="text-2xl font-bold text-primary">{au.price}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Account Age:</span>
                      <span className="font-bold text-accent">{au.accountAge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Credit Limit:</span>
                      <span className="font-bold">{au.creditLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Utilization:</span>
                      <span className="font-bold text-green-600">{au.utilization}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    disabled={!au.available || !hasSignedAgreement}
                    variant={au.available ? "default" : "secondary"}
                    onClick={() => au.available && handleAURequest(au.id)}
                  >
                    {!hasSignedAgreement ? 'Sign Agreement First' : 
                     au.available ? 'Request AU Slot' : 'Sold Out'}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button variant="outline" size="lg" onClick={() => window.open('https://tradelinesupply.com', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Browse More AU Options
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Business Tradelines */}
        <Card className="mb-8 border-2 border-secondary/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10">
            <CardTitle className="flex items-center text-2xl">
              <Building className="h-6 w-6 mr-3 text-secondary" />
              Business Tradelines
            </CardTitle>
            <CardDescription className="text-lg">
              Build business credit separate from personal credit
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {businessTradelines.map((business, index) => (
                <div key={index} className="border border-border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">{business.name}</h3>
                  <Badge variant="outline" className="mb-4">{business.type}</Badge>
                  <p className="text-muted-foreground mb-4">{business.description}</p>
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="font-medium">Reports To: </span>
                      <span>{business.bureaus}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(business.link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
          <CardContent className="text-center py-12">
            <Star className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Credit?</h2>
            <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our team is here to guide you through every step of your credit building journey. 
              Contact us for personalized recommendations.
            </p>
            <Button size="lg" className="text-lg px-8 py-3" onClick={handleScheduleConsultation}>
              {hasSignedAgreement ? 'Schedule Consultation' : 'Sign Agreement to Schedule'}
            </Button>
          </CardContent>
        </Card>

        {/* Modals */}
        <ClientAgreementModal 
          isOpen={showAgreementModal} 
          onClose={() => setShowAgreementModal(false)}
          onAgreementSigned={refetchAgreementStatus}
        />
        <AURequestModal 
          isOpen={showAUModal} 
          onClose={() => setShowAUModal(false)}
          tradelineId={selectedTradelineId}
        />
        <ConsultationModal 
          isOpen={showConsultationModal} 
          onClose={() => setShowConsultationModal(false)}
        />
      </div>
    </div>
  );
}