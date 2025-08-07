import { useState } from 'react';
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
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-gradient-elegant opacity-80" />
        
        {/* Background Logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <img src="/lovable-uploads/9e7b0b62-1d6a-4100-90af-cef2cfc9b187.png" alt="Background Logo" className="w-96 h-96 object-contain filter brightness-200 contrast-150 mix-blend-overlay" />
        </div>
        
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-12">
            {/* Hero Content */}
            <div className="text-center">
              <div className="flex flex-col items-center justify-center mb-8">
                
            <div className="text-center">
                  <h1 className="text-4xl text-primary-foreground mb-2 font-bold mx-0 lg:text-5xl">
                    Express Credit & Financial Solutions
                  </h1>
                  <p className="text-xl text-primary-foreground/80">Professional Credit & Financial Solutions Services</p>
                </div>
              </div>
              
              <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">Transform your financial future with our proven credit repair strategies. Our expert team has helped Thousands of clients improve their credit scores and achieve their financial goals.</p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all duration-300" onClick={() => setModalContent('fcra')}>
                  <Star className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="text-primary-foreground mb-1 font-semibold text-base">FCRA & CFPB Analysis</h3>
                  <p className="text-primary-foreground/80 text-sm">Advanced Credit File Investigations by Certified FCRA Experts: </p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all duration-300" onClick={() => setModalContent('legal')}>
                  <Award className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold text-primary-foreground mb-1">Legal Dispute Precision</h3>
                  <p className="text-sm text-primary-foreground/80">95% success rate using verified methods</p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all duration-300" onClick={() => setModalContent('rapid')}>
                  <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold text-primary-foreground mb-1">Rapid Dispute Turnaround</h3>
                  <p className="text-sm text-primary-foreground/80">See improvements in 15-30 days</p>
                </div>
              </div>

              {!showForms && <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => setShowForms(true)} className="btn-gold text-lg px-8 py-3" size="lg">
                    Get Started Today
                  </Button>
                  <Button onClick={() => {
                setShowForms(true);
                setIsLogin(true);
              }} className="btn-silver text-lg px-8 py-3" size="lg">Client Login Portal</Button>
                </div>}
            </div>

            {/* Login/Register Forms */}
            {showForms && <div className="animate-slide-up flex justify-center">
                {isLogin ? <LoginForm onToggleForm={() => setIsLogin(false)} /> : <RegisterForm onToggleForm={() => setIsLogin(true)} />}
              </div>}
          </div>

        </div>
      </div>
      
      {/* Content Modal */}
      <ContentModal isOpen={modalContent !== null} onClose={() => setModalContent(null)} content={modalContent || 'fcra'} />
      
      {/* Membership Plans Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              MEMBERSHIP PLAN OPTIONS
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-4xl mx-auto">
              Explore our premium credit restoration packages designed to meet your goals, whether you're rebuilding, 
              optimizing, or transforming your financial profile. Each plan includes expert guidance, compliance-driven 
              dispute strategies, and personalized service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Gold Basic Package */}
            <Card className="relative bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <CardTitle className="text-lg text-primary-foreground">Gold Basic Package</CardTitle>
                </div>
                <div className="text-2xl font-bold text-accent">$99.99 / 45 Days</div>
                <div className="text-sm text-primary-foreground/80">Then just $49.99/month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-primary-foreground/90 space-y-2">
                  <li>• Disputes for up to 4 accounts/month (1 bureau)</li>
                  <li>• Monthly Credit Report Review & Analysis</li>
                  <li>• Credit Monitoring Setup Guidance</li>
                  <li>• Custom Onboarding Email with Action Checklist</li>
                  <li>• Access to Client Document Portal</li>
                  <li>• Limited Email Support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Pro Package */}
            <Card className="relative bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-accent text-accent-foreground">⭐ Most Popular</Badge>
              </div>
              <CardHeader className="text-center pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-accent" />
                  <CardTitle className="text-lg text-primary-foreground">Pro Package</CardTitle>
                </div>
                <div className="text-2xl font-bold text-accent">$179.99 / 45 Days</div>
                <div className="text-sm text-primary-foreground/80">Then just $79.99/month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-primary-foreground/90 space-y-2">
                  <li>• Disputes for up to 10 accounts/month across 3 bureaus</li>
                  <li>• Includes everything in Basic</li>
                  <li>• Custom Dispute Letter Generation</li>
                  <li>• Monthly Credit Coaching Call with a credit expert</li>
                  <li>• Priority Email & Chat Support</li>
                  <li>• Soft Inquiry Removal Assistance</li>
                  <li>• Monthly Credit Score Progress Tracking Report</li>
                </ul>
              </CardContent>
            </Card>

            {/* Elite Package */}
            <Card className="relative bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-accent" />
                  <CardTitle className="text-lg text-primary-foreground">Elite Package (Premium Strategy Plan)</CardTitle>
                </div>
                <div className="text-2xl font-bold text-accent">$249.99 / 45 Days</div>
                <div className="text-sm text-primary-foreground/80">Then just $99.99/month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-primary-foreground/90 space-y-2">
                  <li>• Unlimited Disputes with advanced bureau tactics</li>
                  <li>• Includes everything in Pro</li>
                  <li>• Direct Assigned Credit Coach</li>
                  <li>• 24–48 Hour Dispute Prep Turnaround</li>
                  <li>• Rebuilding Strategy Session (tradelines, AU options)</li>
                  <li>• Cease & Desist & Debt Validation Letters</li>
                  <li>• Data Freeze Setup Support (LexisNexis, SageStream, etc.)</li>
                </ul>
              </CardContent>
            </Card>

            {/* All Exclusive Package */}
            <Card className="relative bg-gradient-to-br from-accent/20 to-accent/5 backdrop-blur-sm border-accent/30 hover:border-accent/50 transition-all duration-300 bg-transparent">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-elegant text-primary-foreground">🔥 Premium</Badge>
              </div>
              <CardHeader className="text-center pt-6 bg-transparent">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <CardTitle className="text-lg text-primary-foreground">All Exclusive Package</CardTitle>
                </div>
                <div className="text-2xl font-bold text-accent">$599.99</div>
                <div className="text-sm text-primary-foreground/80">One-Time, 45-Day Audit Service</div>
                <div className="text-xs text-primary-foreground/60">VIP Ongoing Maintenance: $124.99/month (optional)</div>
              </CardHeader>
              <CardContent className="space-y-3 bg-transparent">
                <ul className="text-sm text-primary-foreground/90 space-y-2">
                  <li>• Full Credit Report Audit + Violation Flagging</li>
                  <li>• Unlimited Disputes across all accounts</li>
                  <li>• Custom Dispute Strategy Playbook</li>
                  <li>• Upload & Review of All Supporting Documents</li>
                  <li>• VIP Concierge Priority Service</li>
                  <li>• 60-Day Post Audit Follow-Up</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Section */}
          <div className="mt-16 bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-8 rounded-xl border border-slate-700">
            <h3 className="text-2xl font-bold text-center text-accent mb-6">We Accept All Major Payment Methods</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 items-center justify-items-center mb-8">
              <img 
                src="/lovable-uploads/607fa3b0-29f0-46a4-86de-39e4e8e1c245.png" 
                alt="American Express logo" 
                className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
                style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
              />
              <img 
                src="/lovable-uploads/c74587ad-a808-43ca-b093-cdc6ac5585c8.png" 
                alt="MasterCard logo" 
                className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
                style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
              />
              <img 
                src="/lovable-uploads/fc9628bb-8f09-450a-ae12-b97627dd735d.png" 
                alt="Discover logo" 
                className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
                style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
              />
              <img 
                src="/lovable-uploads/057496bb-7585-4c04-94b2-85d91eb244ea.png" 
                alt="Apple Pay logo" 
                className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
                style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
              />
              <img 
                src="/lovable-uploads/891a5755-258c-44d1-8553-249b16e50413.png" 
                alt="Cash App logo" 
                className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
                style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
              />
              <img 
                src="/lovable-uploads/4068ca38-422c-424c-a722-661a31ecc1b8.png" 
                alt="Affirm logo" 
                className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
                style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
              />
              <img 
                src="/lovable-uploads/b879e2a7-3060-4d30-8907-67cbecf22228.png" 
                alt="Klarna logo" 
                className="payment-logo max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110"
                style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
              />
              <div className="bg-white/10 p-2 rounded text-center text-xs font-medium text-accent border border-yellow-500/30" style={{filter: 'drop-shadow(0 0 8px gold)'}}>
                Visa • JCB • Diners • UnionPay
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-xl font-bold text-accent mb-4">Flexible Payment Plan Options Available!</h4>
              <p className="text-primary-foreground/80 mb-4">We've partnered with industry-leading payment companies so you can get started today and pay your way:</p>
              
              <div className="flex justify-center gap-6 mb-4 flex-wrap">
                <img 
                  src="/lovable-uploads/4068ca38-422c-424c-a722-661a31ecc1b8.png" 
                  alt="Affirm" 
                  className="max-h-[32px] px-2 py-1 transition-all duration-300 hover:scale-110"
                  style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
                />
                <img 
                  src="/lovable-uploads/b879e2a7-3060-4d30-8907-67cbecf22228.png" 
                  alt="Klarna" 
                  className="max-h-[32px] px-2 py-1 transition-all duration-300 hover:scale-110"
                  style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
                />
                <img 
                  src="/lovable-uploads/891a5755-258c-44d1-8553-249b16e50413.png" 
                  alt="Cash App Pay" 
                  className="max-h-[32px] px-2 py-1 transition-all duration-300 hover:scale-110"
                  style={{filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 16px #FFD700)'}}
                />
              </div>
              
              <p className="text-sm text-primary-foreground/60 italic">
                Choose your favorite payment method or sign up with a payment plan for even more flexibility. Getting started has never been easier!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <button onClick={() => setPolicyModal('terms')} className="text-primary-foreground/80 hover:text-accent transition-colors text-sm underline">
                Terms & Conditions
              </button>
              <button onClick={() => setPolicyModal('privacy')} className="text-primary-foreground/80 hover:text-accent transition-colors text-sm underline">
                Privacy Policy
              </button>
              <button onClick={() => setPolicyModal('refund')} className="text-primary-foreground/80 hover:text-accent transition-colors text-sm underline">
                Refund Policy
              </button>
            </div>
            <div className="text-xs text-primary-foreground/60 text-center md:text-right">
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