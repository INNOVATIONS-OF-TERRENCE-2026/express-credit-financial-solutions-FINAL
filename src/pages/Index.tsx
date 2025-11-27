import { useState } from 'react';
import { VisaLogo } from '@/components/VisaLogo';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useRoles } from '@/hooks/useRoles';
import { NavigationHeader } from '@/components/NavigationHeader';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { ClientDashboard } from '@/components/ClientDashboard';
import { AdminPanel } from '@/components/AdminPanel';
import { Button } from '@/components/ui/button';
import { Shield, Star, Award, TrendingUp, CreditCard, Lock, FileText, UserCheck, Clock, Play, Upload, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ContentModal } from '@/components/ContentModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AICreditAssistant } from '@/components/AICreditAssistant';
import { OnboardingTour, useOnboarding } from '@/components/OnboardingTour';
import { DocumentArchive } from '@/components/DocumentArchive';
import { DisputeTimelineTracker } from '@/components/DisputeTimelineTracker';
import { ChatHistoryPanel } from '@/components/ChatHistoryPanel';
import { CreditScanSummary } from '@/components/CreditScanSummary';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { SEOHead } from '@/components/SEOHead';
import { TrustSignals } from '@/components/TrustSignals';
import { FAQSection } from '@/components/FAQSection';
import { redirectToCheckout } from "@/lib/createCheckout";
import { EngineerCredit } from "@/components/EngineerCredit";
import { useExpressAdAudioOnce } from "@/hooks/useExpressAdAudioOnce";
import type { PlanKey } from "@/config/priceMap";

const Index = () => {
  // Mount audio hook for landing page
  useExpressAdAudioOnce();

  const [isLogin, setIsLogin] = useState(true);
  const [showForms, setShowForms] = useState(false);
  const [modalContent, setModalContent] = useState<'fcra' | 'legal' | 'rapid' | null>(null);
  const [policyModal, setPolicyModal] = useState<'terms' | 'privacy' | 'refund' | null>(null);
  const {
    user,
    loading,
    signIn,
    signUp
  } = useAuth();
  const {
    planType,
    paymentStatus,
    hasAccess
  } = useMembership();
  const {
    isAdmin
  } = useRoles();
  const {
    toast
  } = useToast();
  const {
    shouldShowTour,
    isLoading: onboardingLoading,
    startTour,
    completeTour,
    skipTour
  } = useOnboarding();
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    if (user) {
      if (hasAccess("dispute-generator")) {
        navigate("/client-portal");
      } else {
        navigate("/membership");
      }
    } else {
      navigate("/login");
    }
  };

  const handlePlanClick = async (planKey: PlanKey) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase a membership",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      await redirectToCheckout(planKey);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };
  
  const handleLogin = async (email: string, password: string) => {
    const {
      error
    } = await signIn(email, password);
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleRegister = async (userData: any) => {
    const {
      error
    } = await signUp(userData.email, userData.password);
    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account."
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-b-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>;
  }

  // Show dashboard for authenticated users
  if (user) {
    return <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <EngineerCredit position="top" />
        <div className="absolute inset-0 bg-gradient-elegant opacity-80" />
        <NavigationHeader />
        <main className="relative z-10 container mx-auto px-4 py-8">
          <div className="space-y-6">
            
            {/* Email Verification Banner */}
            <EmailVerificationBanner />
            
            {/* SBA Portal Banner - Always visible at top */}
            <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm border-green-500/30 hover:from-green-600/30 hover:to-blue-600/30 transition-all duration-300 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-lg" style={{background: 'var(--gradient-dark-blue-green)'}}>
                  <div className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                      <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0">🚀 Funding Access</Badge>
                    </div>
                    <h2 className="text-2xl font-bold text-primary-foreground mb-2">
                      SBA Loan Automation Portal — 0804 Edition
                    </h2>
                    <p className="text-primary-foreground/90">
                      Pre-qualify, upload docs, auto-generate your SBA packet, and get lender-ready faster than ever.
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/sba-portal')}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0 px-8 py-3 text-lg font-semibold shadow-lg"
                  >
                    Enter SBA Portal
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Welcome Section */}
            <div className="text-center">
              <h1 className="font-bold text-primary-foreground mb-2 text-3xl">
                Welcome to Express Credit & Financial Solutions
              </h1>
              <p className="text-primary-foreground/80">
                Manage your credit repair journey and track your progress
              </p>
            </div>

            {/* Membership Status */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="bg-gradient-elegant">
                <CardTitle className="flex items-center gap-2 text-primary-foreground">
                  <Star className="h-5 w-5" />
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent className="backdrop-blur-sm bg-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-foreground/60">Current Plan</p>
                    <div className="flex items-center gap-2">
                      {planType ? <Badge variant={paymentStatus === 'active' ? 'default' : 'secondary'}>
                          {planType}
                        </Badge> : <Badge variant="outline">No Plan</Badge>}
                      {paymentStatus === 'active' ? <Badge variant="default">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/membership')} className="bg-white/10 text-primary-foreground border-white/20 hover:bg-white/20">
                    Manage Membership
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Credit Score Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Credit Score</CardTitle>
                  <CardDescription className="text-primary-foreground/80">TransUnion VantageScore 3.0</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-foreground">680</div>
                    <p className="text-sm text-primary-foreground/60">Good</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Payment Status</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Your subscription status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary-foreground/60">Current Plan</p>
                      <div className="flex items-center gap-2">
                        {planType ? <Badge variant={paymentStatus === 'active' ? 'default' : 'secondary'}>
                            {planType}
                          </Badge> : <Badge variant="outline">No Plan</Badge>}
                        {paymentStatus === 'active' ? <Badge variant="default">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/membership')} className="bg-white/10 text-primary-foreground border-white/20 hover:bg-white/20">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Dispute Progress Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Dispute Progress</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Track your dispute outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-foreground">3</div>
                    <p className="text-sm text-primary-foreground/60">Items Disputed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Features Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DocumentArchive />
              <DisputeTimelineTracker />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChatHistoryPanel />
              <CreditScanSummary />
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className={hasAccess('dashboard') ? 'cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20' : 'opacity-50 bg-white/5 backdrop-blur-sm border-white/10'} onClick={() => hasAccess('dashboard') && navigate('/')} data-tour="track-progress">
                <CardHeader className="text-center bg-transparent">
                  <Star className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Dashboard</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">View your credit overview</CardDescription>
                </CardHeader>
              </Card>

              <Card className={hasAccess('dispute-generator') ? 'cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20' : 'opacity-50 bg-white/5 backdrop-blur-sm border-white/10'} onClick={() => hasAccess('dispute-generator') && navigate('/dispute-center')} data-tour="dispute-center">
                <CardHeader className="text-center bg-transparent">
                  <Award className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Dispute Center</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Generate dispute letters</CardDescription>
                  {!hasAccess('dispute-generator') && <Badge variant="outline" className="mt-2 bg-white/20 text-primary-foreground border-white/30">Pro+ Required</Badge>}
                </CardHeader>
              </Card>

              <Card className={hasAccess('credit-upload') ? 'cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20' : 'opacity-50 bg-white/5 backdrop-blur-sm border-white/10'} onClick={() => hasAccess('credit-upload') && navigate('/upload-credit-report')} data-tour="upload-report">
                <CardHeader className="text-center bg-transparent">
                  <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Upload Credit Report</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Upload & analyze credit reports</CardDescription>
                  {!hasAccess('credit-upload') && <Badge variant="outline" className="mt-2 bg-white/20 text-primary-foreground border-white/30">Pro+ Required</Badge>}
                </CardHeader>
              </Card>

              {/* Client Agreement Section */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20" onClick={() => navigate('/onboarding')} data-tour="sign-agreement">
                <CardHeader className="text-center bg-transparent">
                  <UserCheck className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Sign Agreement</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Complete your client agreement</CardDescription>
                </CardHeader>
              </Card>

              <Card className={hasAccess('dashboard') ? 'cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20' : 'opacity-50 bg-white/5 backdrop-blur-sm border-white/10'} onClick={() => hasAccess('dashboard') && navigate('/ai-assistant')}>
                <CardHeader className="text-center bg-transparent">
                  <Star className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">LUCY LOUNGE AI</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Get instant credit advice</CardDescription>
                  {!hasAccess('dashboard') && <Badge variant="outline" className="mt-2 bg-white/20 text-primary-foreground border-white/30">Basic+ Required</Badge>}
                </CardHeader>
              </Card>

              <Card className={hasAccess('education') ? 'cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20' : 'opacity-50 bg-white/5 backdrop-blur-sm border-white/10'} onClick={() => hasAccess('education') && navigate('/education')}>
                <CardHeader className="text-center bg-transparent">
                  <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Education</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Learn credit strategies</CardDescription>
                  {!hasAccess('education') && <Badge variant="outline" className="mt-2 bg-white/20 text-primary-foreground border-white/30">Basic+ Required</Badge>}
                </CardHeader>
              </Card>

              {/* Credit Building Portal - Publicly Accessible */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20" onClick={() => navigate('/credit-building')} data-tour="credit-building">
                <CardHeader className="text-center bg-transparent">
                  <CreditCard className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Credit Building</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Grow your credit with tradelines & tools</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20" onClick={() => navigate('/data-freeze')}>
                <CardHeader className="text-center bg-transparent">
                  <Lock className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Data Freeze</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Freeze 3rd-party data before disputing</CardDescription>
                </CardHeader>
              </Card>

              {/* Document Upload Center */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20" onClick={() => navigate('/document-center')}>
                <CardHeader className="text-center bg-transparent">
                  <FileText className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Document Center</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Upload ID verification documents</CardDescription>
                </CardHeader>
              </Card>

              {/* SBA Loan Portal */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20" onClick={() => navigate('/sba')}>
                <CardHeader className="text-center bg-transparent">
                  <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">SBA Loan Portal</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Apply for SBA loans & funding</CardDescription>
                </CardHeader>
              </Card>

              {/* Client Portals - Admin Only */}
              {isAdmin() && <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20" onClick={() => navigate('/client-portals')}>
                  <CardHeader className="text-center bg-transparent">
                    <User className="h-8 w-8 text-accent mx-auto mb-2" />
                    <CardTitle className="text-lg text-primary-foreground">Client Portals</CardTitle>
                    <CardDescription className="text-primary-foreground/90 font-medium">Access individual client accounts</CardDescription>
                  </CardHeader>
                </Card>}
            </div>

            {/* Onboarding Tour Controls */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-foreground">Need Help Getting Started?</h3>
                    <p className="text-sm text-primary-foreground/80">Take our interactive tour to learn about all features</p>
                  </div>
                  <Button onClick={startTour} disabled={onboardingLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Play className="h-4 w-4 mr-2" />
                    Start Tour
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        {/* AI Credit Assistant Widget - Only for logged-in users */}
        {user && <AICreditAssistant isWidget={true} />}

        {/* Onboarding Tour */}
        {shouldShowTour && !onboardingLoading && <OnboardingTour onComplete={completeTour} onSkip={skipTour} />}
        
        <EngineerCredit position="bottom" />
      </div>;
  }

  // Landing Page Content
  return <div className="min-h-screen bg-background">
      <SEOHead title="Express Credit - Credit Repair Services" description="Get your credit fixed fast with Express Credit's expert credit repair services. Free consultation." />
      <EngineerCredit position="top" />
      <NavigationHeader />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            Take Control of Your Credit Today
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            We help you repair your credit and achieve your financial goals.
          </p>
          <Button size="lg" onClick={handleGetStarted}>
            Get Started
          </Button>
        </section>

        {/* Trust Signals */}
        <TrustSignals />

        {/* Key Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Feature 1: Credit Repair */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary-foreground">
                Credit Repair Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We challenge inaccurate items on your credit report to improve
                your score.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2: Credit Building */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary-foreground">
                Credit Building Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Learn how to build and maintain a healthy credit profile.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3: Financial Education */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary-foreground">
                Financial Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access resources and tools to make informed financial decisions.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Pricing Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center text-primary-foreground mb-8">
            Our Pricing Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary-foreground">
                  Basic Package
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Essential credit repair tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">
                    $99/month
                  </span>
                </div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  <li>Credit report analysis</li>
                  <li>Dispute letter generation</li>
                  <li>24/7 support</li>
                </ul>
                <Button className="mt-4 w-full" onClick={() => handlePlanClick("basic")}>
                  Sign Up
                </Button>
                <p className="text-xs text-green-500 mt-2">
                  ✅ 90-Day Money-Back Guarantee
                </p>
                <Badge className="bg-red-500 text-white mt-2">
                  Christmas Sale!
                </Badge>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary-foreground">
                  Pro Package
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Advanced credit repair and building
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">
                    $179.99/month
                  </span>
                </div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  <li>Everything in Basic</li>
                  <li>Credit score tracking</li>
                  <li>Personalized credit advice</li>
                </ul>
                <Button className="mt-4 w-full" onClick={() => handlePlanClick("pro")}>
                  Sign Up
                </Button>
                <p className="text-xs text-green-500 mt-2">
                  ✅ 90-Day Money-Back Guarantee
                </p>
                <Badge className="bg-red-500 text-white mt-2">
                  Christmas Sale!
                </Badge>
              </CardContent>
            </Card>

            {/* Elite Plan */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary-foreground">
                  Elite Package
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Comprehensive credit solution with expert support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">
                    $249.99/month
                  </span>
                </div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  <li>Everything in Pro</li>
                  <li>Priority support</li>
                  <li>Unlimited disputes</li>
                </ul>
                <Button className="mt-4 w-full" onClick={() => handlePlanClick("elite")}>
                  Sign Up
                </Button>
                <p className="text-xs text-green-500 mt-2">
                  ✅ 90-Day Money-Back Guarantee
                </p>
                <Badge className="bg-red-500 text-white mt-2">
                  Christmas Sale!
                </Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Content Modals */}
        <ContentModal isOpen={modalContent === 'fcra'} onClose={() => setModalContent(null)} content="fcra" />
        <ContentModal isOpen={modalContent === 'legal'} onClose={() => setModalContent(null)} content="legal" />
        <ContentModal isOpen={modalContent === 'rapid'} onClose={() => setModalContent(null)} content="rapid" />

        {/* Policy Modals */}
        <Dialog open={policyModal === 'terms'} onOpenChange={(open) => open ? setPolicyModal('terms') : setPolicyModal(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Terms and Conditions</DialogTitle>
              <DialogDescription>
                Please read our terms and conditions carefully before using our
                services.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] w-full">
              <p className="text-sm text-muted-foreground">
                Our Terms and Conditions outline the rules and regulations for
                the use of Express Credit & Financial Solutions's Website.
              </p>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={policyModal === 'privacy'} onOpenChange={(open) => open ? setPolicyModal('privacy') : setPolicyModal(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Privacy Policy</DialogTitle>
              <DialogDescription>
                Learn how we collect, use, and protect your personal information.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] w-full">
              <p className="text-sm text-muted-foreground">
                Our Privacy Policy describes how we handle your data when you use
                our website.
              </p>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={policyModal === 'refund'} onOpenChange={(open) => open ? setPolicyModal('refund') : setPolicyModal(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Refund Policy</DialogTitle>
              <DialogDescription>
                Understand our refund policy and how to request a refund.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] w-full">
              <p className="text-sm text-muted-foreground">
                Our Refund Policy explains the conditions under which you may be
                eligible for a refund.
              </p>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* FAQ Section */}
        <FAQSection />

        {/* Contact Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Contact Us
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Have questions? Reach out to our team for assistance.
          </p>
          <Button variant="outline">Contact Support</Button>
        </section>
      </main>
      <EngineerCredit position="bottom" />
    </div>;
};

export default Index;

