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
import { createCheckoutSession } from "@/lib/createCheckout";
import type { PlanKey } from "@/config/priceMap";
const Index = () => {
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
      await createCheckoutSession(planKey);
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
                  <CardTitle className="text-lg text-primary-foreground">AI Credit Assistant</CardTitle>
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
      </div>;
  }

  // Landing page with login/register forms
  return <div className="min-h-screen bg-fintech-primary">
      <SEOHead />
      {/* Hero Section with Video Background */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/EXPRESS_CREDIT.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-primary/95 via-fintech-primary/75 to-fintech-secondary/85" />
        
        {/* Subtle Financial Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-5" 
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,195,232,0.3) 35px, rgba(0,195,232,0.3) 36px)'
          }} 
        />
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center gap-12">
            {/* Hero Content */}
            <div className="text-center max-w-5xl animate-fade-in">
              <h1 className="font-poppins text-5xl md:text-6xl lg:text-7xl font-bold text-fintech-light mb-6 leading-tight">
                Fix Your Credit. Fund Your Business.
                <span className="block text-fintech-accent mt-2">Secure SBA Approval.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-fintech-light/90 mb-4 font-light">
                Express Credit makes it simple to get approved — credit repair + SBA loan automation, all in one portal.
              </p>
              
              <p className="text-lg md:text-xl text-fintech-light/70 mb-12 font-light">
                From credit repair to capital — we don't just fix scores, we fund dreams.
              </p>

              {/* Features Grid - Glassmorphic Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div 
                  className="group cursor-pointer p-6 bg-fintech-primary/40 backdrop-blur-md rounded-xl border border-fintech-accent/30 hover:border-fintech-accent hover:bg-fintech-primary/60 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,195,232,0.3)]"
                  onClick={() => setModalContent('fcra')}
                >
                  <Star className="h-12 w-12 text-fintech-accent mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-poppins font-semibold text-lg text-fintech-light mb-2">FCRA & CFPB Analysis</h3>
                  <p className="text-fintech-light/80 text-sm">Advanced credit file investigations by certified FCRA experts</p>
                </div>
                
                <div 
                  className="group cursor-pointer p-6 bg-fintech-primary/40 backdrop-blur-md rounded-xl border border-fintech-accent/30 hover:border-fintech-accent hover:bg-fintech-primary/60 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,195,232,0.3)]"
                  onClick={() => setModalContent('legal')}
                >
                  <Award className="h-12 w-12 text-fintech-accent mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-poppins font-semibold text-lg text-fintech-light mb-2">Legal Dispute Precision</h3>
                  <p className="text-fintech-light/80 text-sm">95% success rate using verified legal methods</p>
                </div>
                
                <div 
                  className="group cursor-pointer p-6 bg-fintech-primary/40 backdrop-blur-md rounded-xl border border-fintech-accent/30 hover:border-fintech-accent hover:bg-fintech-primary/60 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,195,232,0.3)]"
                  onClick={() => setModalContent('rapid')}
                >
                  <TrendingUp className="h-12 w-12 text-fintech-accent mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-poppins font-semibold text-lg text-fintech-light mb-2">Rapid Turnaround</h3>
                  <p className="text-fintech-light/80 text-sm">See improvements in 15-30 days</p>
                </div>
              </div>

              {!showForms && <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => setShowForms(true)} 
                    variant="fintech-primary"
                    size="lg"
                    className="text-lg px-10 py-6 h-auto"
                  >
                    Get Started Today
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowForms(true);
                      setIsLogin(true);
                    }} 
                    variant="fintech-outline"
                    size="lg"
                    className="text-lg px-10 py-6 h-auto"
                  >
                    Client Login Portal
                  </Button>
                </div>}
            </div>

            {/* Login/Register Forms */}
            {showForms && <div className="animate-slide-up w-full max-w-md">
                <div className="bg-fintech-secondary/90 backdrop-blur-md rounded-xl border border-fintech-accent/30 p-8 shadow-[0_0_50px_rgba(0,195,232,0.2)]">
                  {isLogin ? <LoginForm onToggleForm={() => setIsLogin(false)} /> : <RegisterForm onToggleForm={() => setIsLogin(true)} />}
                </div>
              </div>}
          </div>
        </div>
      </div>
      
      {/* Content Modal */}
      <ContentModal isOpen={modalContent !== null} onClose={() => setModalContent(null)} content={modalContent || 'fcra'} />
      
      {/* Section 1: Why Choose Us - Dark Background */}
      <div className="bg-fintech-primary py-20 border-t border-fintech-accent/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-poppins text-4xl md:text-5xl font-bold text-fintech-light mb-4">
              Why Choose <span className="text-fintech-accent">Express Credit?</span>
            </h2>
            <p className="text-lg text-fintech-light/80 max-w-3xl mx-auto">
              Transform your financial future with our proven strategies and expert guidance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-fintech-secondary/50 backdrop-blur-sm rounded-xl border border-fintech-accent/20 hover:border-fintech-accent/50 transition-all duration-300 hover:scale-105">
              <Shield className="h-16 w-16 text-fintech-accent mx-auto mb-4" />
              <h3 className="font-poppins font-semibold text-xl text-fintech-light mb-3">Proven Results</h3>
              <p className="text-fintech-light/70">Thousands of clients have improved their credit scores with our expert methods</p>
            </div>
            
            <div className="text-center p-8 bg-fintech-secondary/50 backdrop-blur-sm rounded-xl border border-fintech-accent/20 hover:border-fintech-accent/50 transition-all duration-300 hover:scale-105">
              <Lock className="h-16 w-16 text-fintech-accent mx-auto mb-4" />
              <h3 className="font-poppins font-semibold text-xl text-fintech-light mb-3">Secure & Compliant</h3>
              <p className="text-fintech-light/70">FCRA compliant strategies that protect your rights and your data</p>
            </div>
            
            <div className="text-center p-8 bg-fintech-secondary/50 backdrop-blur-sm rounded-xl border border-fintech-accent/20 hover:border-fintech-accent/50 transition-all duration-300 hover:scale-105">
              <Clock className="h-16 w-16 text-fintech-accent mx-auto mb-4" />
              <h3 className="font-poppins font-semibold text-xl text-fintech-light mb-3">Fast Results</h3>
              <p className="text-fintech-light/70">See improvements in as little as 15-30 days with our rapid process</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Section 2: Membership Plans - Light Background */}
      <div className="bg-fintech-support py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-poppins text-4xl md:text-5xl font-bold text-fintech-dark mb-4">
              Choose Your <span className="text-fintech-accent">Membership Plan</span>
            </h2>
            <p className="text-lg text-fintech-dark/80 max-w-4xl mx-auto">
              Premium credit restoration packages designed to meet your goals, whether you're rebuilding, 
              optimizing, or transforming your financial profile.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Fast-5 Package - NEW */}
            <Card className="relative bg-gradient-to-br from-cyan-50 via-white to-blue-50 border-cyan-400 hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] transition-all duration-300 scale-105 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-pulse">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm px-4 py-1 shadow-lg border-2 border-cyan-300 animate-pulse">🚀 Limited Time Offer</Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="font-poppins text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Fast-5</CardTitle>
                <div className="text-4xl font-bold text-cyan-600 mt-2">$350</div>
                <div className="text-sm text-fintech-dark/70 font-semibold">One-Time Fast-Track Service</div>
              </CardHeader>
              <CardContent className="space-y-2 px-4">
                <ul className="text-xs text-fintech-dark/90 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600 font-bold">✓</span>
                    <span>Fast-Track 5-Day Credit Boost</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600 font-bold">✓</span>
                    <span>All 3 Bureaus Rapid Processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600 font-bold">✓</span>
                    <span>Priority Queue Immediate Action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600 font-bold">✓</span>
                    <span>48-Hour Response Guarantee</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => handlePlanClick("fast5")}
                  className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg"
                >
                  Get Started Now
                </Button>
              </CardContent>
            </Card>

            {/* Unlimited Clean-Slate Package - NEW */}
            <Card className="relative bg-gradient-to-br from-slate-50 via-white to-slate-100 border-slate-400 hover:shadow-[0_0_50px_rgba(203,213,225,0.5)] transition-all duration-300 scale-105 shadow-[0_0_30px_rgba(203,213,225,0.4)] animate-pulse">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-slate-300 to-slate-500 text-slate-900 font-bold text-sm px-4 py-1 shadow-lg border-2 border-slate-300 animate-pulse">👑 Limited Time Offer</Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(203,213,225,0.7)]">
                    <Award className="w-6 h-6 text-slate-900" />
                  </div>
                </div>
                <CardTitle className="font-poppins text-xl font-bold bg-gradient-to-r from-slate-500 to-slate-700 bg-clip-text text-transparent">Unlimited Clean-Slate</CardTitle>
                <div className="text-4xl font-bold text-slate-700 mt-2">$550</div>
                <div className="text-sm text-fintech-dark/70 font-semibold">Complete Profile Reset</div>
              </CardHeader>
              <CardContent className="space-y-2 px-4">
                <ul className="text-xs text-fintech-dark/90 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 font-bold">✓</span>
                    <span>Unlimited Disputes Until Clean</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 font-bold">✓</span>
                    <span>All Bureaus + Consumer Databases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 font-bold">✓</span>
                    <span>Dedicated Credit Strategist</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 font-bold">✓</span>
                    <span>90-Day Success Guarantee</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => handlePlanClick("unlimited")}
                  className="w-full mt-4 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white font-semibold shadow-lg"
                >
                  Get Started Now
                </Button>
              </CardContent>
            </Card>

            {/* Gold Basic Package */}
            <Card className="relative bg-white border-fintech-accent/20 hover:border-fintech-accent hover:shadow-[0_0_30px_rgba(0,195,232,0.2)] transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <CardTitle className="font-poppins text-lg text-fintech-dark">Gold Basic</CardTitle>
                </div>
                <div className="text-3xl font-bold text-fintech-accent">$99.99</div>
                <div className="text-sm text-fintech-dark/70">45 Days, then $49.99/mo</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-fintech-dark/90 space-y-2">
                  <li>✓ Disputes for up to 4 accounts/month</li>
                  <li>✓ Monthly credit report review</li>
                  <li>✓ Credit monitoring guidance</li>
                  <li>✓ Document portal access</li>
                  <li>✓ Email support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Pro Package */}
            <Card className="relative bg-white border-fintech-accent hover:shadow-[0_0_30px_rgba(0,195,232,0.3)] transition-all duration-300 scale-105 shadow-[0_0_20px_rgba(0,195,232,0.2)]">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-fintech-accent text-fintech-primary font-semibold">⭐ Most Popular</Badge>
              </div>
              <CardHeader className="text-center pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-fintech-accent" />
                  <CardTitle className="font-poppins text-lg text-fintech-dark">Pro Package</CardTitle>
                </div>
                <div className="text-3xl font-bold text-fintech-accent">$179.99</div>
                <div className="text-sm text-fintech-dark/70">45 Days, then $79.99/mo</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-fintech-dark/90 space-y-2">
                  <li>✓ Up to 10 disputes/month (3 bureaus)</li>
                  <li>✓ Everything in Basic</li>
                  <li>✓ Custom dispute letters</li>
                  <li>✓ Monthly coaching call</li>
                  <li>✓ Priority support</li>
                  <li>✓ Soft inquiry removal</li>
                </ul>
              </CardContent>
            </Card>

            {/* Elite Package */}
            <Card className="relative bg-white border-fintech-accent/20 hover:border-fintech-accent hover:shadow-[0_0_30px_rgba(0,195,232,0.2)] transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-fintech-accent" />
                  <CardTitle className="font-poppins text-lg text-fintech-dark">Elite Package</CardTitle>
                </div>
                <div className="text-3xl font-bold text-fintech-accent">$249.99</div>
                <div className="text-sm text-fintech-dark/70">45 Days, then $99.99/mo</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-fintech-dark/90 space-y-2">
                  <li>✓ Unlimited disputes</li>
                  <li>✓ Everything in Pro</li>
                  <li>✓ Assigned credit coach</li>
                  <li>✓ 24-48hr turnaround</li>
                  <li>✓ Rebuilding strategy</li>
                  <li>✓ Data freeze support</li>
                </ul>
              </CardContent>
            </Card>

            {/* All Exclusive Package */}
            <Card className="relative bg-gradient-to-br from-fintech-accent/10 to-fintech-accent/5 border-fintech-accent hover:shadow-[0_0_40px_rgba(0,195,232,0.3)] transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(0,195,232,0.15)]">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-fintech-primary text-fintech-light font-semibold">🔥 Premium</Badge>
              </div>
              <CardHeader className="text-center pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-fintech-accent" />
                  <CardTitle className="font-poppins text-lg text-fintech-dark">All Exclusive</CardTitle>
                </div>
                <div className="text-3xl font-bold text-fintech-accent">$599.99</div>
                <div className="text-sm text-fintech-dark/70">One-Time 45-Day Audit</div>
                <div className="text-xs text-fintech-dark/60">VIP Maintenance: $124.99/mo</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-fintech-dark/90 space-y-2">
                  <li>✓ Full credit report audit</li>
                  <li>✓ Unlimited disputes</li>
                  <li>✓ Custom strategy playbook</li>
                  <li>✓ Document review</li>
                  <li>✓ VIP concierge service</li>
                  <li>✓ 60-day follow-up</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Trust Signals & EEAT Section */}
      <TrustSignals />

      {/* FAQ Section with Schema */}
      <FAQSection />
      
      {/* Section 3: Payment Methods - Dark Background */}
      <div className="bg-fintech-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="bg-fintech-primary/50 backdrop-blur-sm p-10 rounded-2xl border border-fintech-accent/30">
            <h3 className="font-poppins text-3xl font-bold text-center text-fintech-light mb-8">
              We Accept All Major <span className="text-fintech-accent">Payment Methods</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 items-center justify-items-center mb-10">
              <img 
                src="/lovable-uploads/607fa3b0-29f0-46a4-86de-39e4e8e1c245.png" 
                alt="American Express" 
                className="max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(0,195,232,0.5)]"
              />
              <img 
                src="/lovable-uploads/c74587ad-a808-43ca-b093-cdc6ac5585c8.png" 
                alt="MasterCard" 
                className="max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(0,195,232,0.5)]"
              />
              <img 
                src="/lovable-uploads/fc9628bb-8f09-450a-ae12-b97627dd735d.png" 
                alt="Discover" 
                className="max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(0,195,232,0.5)]"
              />
              <img 
                src="/lovable-uploads/057496bb-7585-4c04-94b2-85d91eb244ea.png" 
                alt="Apple Pay" 
                className="max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(0,195,232,0.5)]"
              />
              <img 
                src="/lovable-uploads/891a5755-258c-44d1-8553-249b16e50413.png" 
                alt="Cash App" 
                className="max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(0,195,232,0.5)]"
              />
              <img 
                src="/lovable-uploads/4068ca38-422c-424c-a722-661a31ecc1b8.png" 
                alt="Affirm" 
                className="max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(0,195,232,0.5)]"
              />
              <img 
                src="/lovable-uploads/b879e2a7-3060-4d30-8907-67cbecf22228.png" 
                alt="Klarna" 
                className="max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(0,195,232,0.5)]"
              />
              <VisaLogo />
            </div>

            <div className="text-center">
              <h4 className="font-poppins text-2xl font-bold text-fintech-accent mb-4">Flexible Payment Plans Available!</h4>
              <p className="text-fintech-light/80 mb-6 max-w-2xl mx-auto">
                We've partnered with industry-leading payment companies so you can get started today and pay your way
              </p>
              
              <div className="flex justify-center gap-8 mb-6 flex-wrap">
                <img 
                  src="/lovable-uploads/4068ca38-422c-424c-a722-661a31ecc1b8.png" 
                  alt="Affirm" 
                  className="max-h-[36px] px-2 py-1 transition-all duration-300 hover:scale-110"
                />
                <img 
                  src="/lovable-uploads/b879e2a7-3060-4d30-8907-67cbecf22228.png" 
                  alt="Klarna" 
                  className="max-h-[36px] px-2 py-1 transition-all duration-300 hover:scale-110"
                />
                <img 
                  src="/lovable-uploads/891a5755-258c-44d1-8553-249b16e50413.png" 
                  alt="Cash App Pay" 
                  className="max-h-[36px] px-2 py-1 transition-all duration-300 hover:scale-110"
                />
              </div>
              
              <p className="text-sm text-fintech-light/60 italic">
                Choose your favorite payment method or sign up with a payment plan for even more flexibility
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-fintech-primary py-10 border-t border-fintech-accent/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
              <button 
                onClick={() => setPolicyModal('terms')} 
                className="text-fintech-light/70 hover:text-fintech-accent transition-colors text-sm font-medium"
              >
                Terms & Conditions
              </button>
              <button 
                onClick={() => setPolicyModal('privacy')} 
                className="text-fintech-light/70 hover:text-fintech-accent transition-colors text-sm font-medium"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setPolicyModal('refund')} 
                className="text-fintech-light/70 hover:text-fintech-accent transition-colors text-sm font-medium"
              >
                Refund Policy
              </button>
            </div>
            <div className="text-sm text-fintech-light/60 text-center md:text-right">
              © 2024 Express Credit & Financial Solutions LLC. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modals */}
      <Dialog open={policyModal !== null} onOpenChange={() => setPolicyModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {policyModal === 'terms' && 'Terms & Conditions'}
              {policyModal === 'privacy' && 'Privacy Policy'}
              {policyModal === 'refund' && 'Refund Policy'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm leading-relaxed">
              {policyModal === 'terms' && <div>
                  <p className="mb-4">
                    By accessing and using our website or subscribing to any service provided by Express Credit & Financial Solutions LLC ("we," "our," "us"), you agree to be bound by the following terms and conditions:
                  </p>
                  <div className="space-y-3">
                    <p><strong>Eligibility:</strong> You must be at least 18 years old and legally capable of entering into a binding agreement.</p>
                    <p><strong>Services:</strong> We offer credit repair, financial education, and credit consulting services via subscription-based plans.</p>
                    <p><strong>Payments:</strong> Subscription fees are billed monthly through our Stripe payment processor. Late or failed payments may result in suspension of services.</p>
                    <p><strong>Client Responsibility:</strong> You agree to provide accurate and truthful information. Results vary based on individual credit history and cooperation.</p>
                    <p><strong>Communication:</strong> By subscribing, you consent to receive communications via email, phone, or SMS related to your account.</p>
                    <p><strong>Termination:</strong> We reserve the right to cancel your service if fraudulent, abusive, or non-cooperative behavior is detected.</p>
                    <p><strong>Disclaimers:</strong> We do not guarantee specific results or credit score increases. Our services are not a substitute for legal or financial advice.</p>
                  </div>
                </div>}
              {policyModal === 'privacy' && <div>
                  <p className="mb-4">
                    Your privacy is important to us. This policy outlines how we collect, use, and protect your information:
                  </p>
                  <div className="space-y-3">
                    <p><strong>Information Collection:</strong> We collect personal data such as name, email, phone number, billing info, and credit report details you voluntarily provide.</p>
                    <p><strong>Usage:</strong> Information is used to provide services, process payments, analyze progress, and improve user experience.</p>
                    <p><strong>Security:</strong> We use SSL encryption, secure databases, and comply with relevant data protection laws to safeguard your data.</p>
                    <p><strong>Sharing:</strong> We do not sell or share your information with third parties unless required by law or necessary to provide our services.</p>
                    <p><strong>Your Rights:</strong> You may request access, correction, or deletion of your data at any time by contacting us.</p>
                  </div>
                </div>}
              {policyModal === 'refund' && <div>
                  <p className="mb-4">
                    Our refund policy is structured to ensure transparency and fairness:
                  </p>
                  <div className="space-y-3">
                    <p><strong>No Refunds on Services Rendered:</strong> Due to the nature of digital credit repair services, all sales are final once services have begun.</p>
                    <p><strong>Cancellation Policy:</strong> Clients may cancel any time via their account dashboard. Cancellations apply to future billings.</p>
                    <p><strong>Billing Errors:</strong> If you believe you were billed in error, please contact us within 7 days of the charge to investigate and resolve.</p>
                  </div>
                </div>}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Index;