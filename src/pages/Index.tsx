import { useState } from 'react';
import { VisaLogo } from '@/components/VisaLogo';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useRoles } from '@/hooks/useRoles';
import { NavigationHeader } from '@/components/NavigationHeader';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { Button } from '@/components/ui/button';
import { Shield, Star, Award, TrendingUp, CreditCard, Lock, FileText, UserCheck, Clock, Play, Upload, User, Sparkles, Snowflake, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ContentModal } from '@/components/ContentModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OnboardingTour, useOnboarding } from '@/components/OnboardingTour';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { SEOHead } from '@/components/SEOHead';
import { TrustSignals } from '@/components/TrustSignals';
import { FAQSection } from '@/components/FAQSection';
import { EngineerCredit } from '@/components/EngineerCredit';
import { ThemeSelector } from '@/components/ThemeSelector';

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForms, setShowForms] = useState(false);
  const [modalContent, setModalContent] = useState<'fcra' | 'legal' | 'rapid' | null>(null);
  const [policyModal, setPolicyModal] = useState<'terms' | 'privacy' | 'refund' | null>(null);
  const { user, loading, signIn, signUp } = useAuth();
  const { planType, paymentStatus, hasAccess } = useMembership();
  const { isAdmin } = useRoles();
  const { toast } = useToast();
  const { shouldShowTour, isLoading: onboardingLoading, startTour, completeTour, skipTour } = useOnboarding();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) toast({ title: "Login Failed", description: error.message, variant: "destructive" });
  };

  const handleRegister = async (userData: any) => {
    const { error } = await signUp(userData.email, userData.password);
    if (error) toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Registration Successful", description: "Please check your email to verify your account." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-b-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ═══════════ AUTHENTICATED DASHBOARD ═══════════
  if (user) {
    const quickActions = [
      { label: 'Upload Report', path: '/upload-credit-report', icon: Upload, accessible: hasAccess('credit-upload') },
      { label: 'File Dispute', path: '/dispute-center', icon: FileText, accessible: hasAccess('dispute-generator') },
      { label: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, accessible: hasAccess('dashboard') },
      { label: 'Education', path: '/education', icon: GraduationCap, accessible: hasAccess('education') },
      { label: 'Score Tracker', path: '/score-tracker', icon: TrendingUp, accessible: hasAccess('dashboard') },
      { label: 'Data Freeze', path: '/data-freeze', icon: Snowflake, accessible: hasAccess('dispute-generator') },
      { label: 'Documents', path: '/document-center', icon: FileText, accessible: hasAccess('dashboard') },
      { label: 'SBA Portal', path: '/sba-portal', icon: Shield, accessible: true },
      { label: 'Credit Building', path: '/credit-building', icon: CreditCard, accessible: hasAccess('credit-building') },
      { label: 'Monitoring', path: '/credit-monitoring', icon: TrendingUp, accessible: hasAccess('dashboard') },
    ];

    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="space-y-6">
            <EmailVerificationBanner />

            {/* Welcome */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome to Express Credit & Financial Solutions</h1>
              <p className="text-muted-foreground">Manage your credit repair journey and track your progress</p>
            </div>

            {/* Hero Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="section-label">Credit Score</p>
                      <p className="stat-number text-foreground mt-1">---</p>
                      <p className="text-xs text-muted-foreground">Upload a report to analyze</p>
                    </div>
                    <div className="rounded-lg p-2.5 bg-primary/10 text-primary"><TrendingUp className="h-5 w-5" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="section-label">Active Disputes</p>
                      <p className="stat-number text-foreground mt-1">0</p>
                      <p className="text-xs text-muted-foreground">File your first dispute</p>
                    </div>
                    <div className="rounded-lg p-2.5 bg-amber-500/10 text-amber-500"><FileText className="h-5 w-5" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="section-label">Documents</p>
                      <p className="stat-number text-foreground mt-1">0</p>
                      <p className="text-xs text-muted-foreground">Upload verification docs</p>
                    </div>
                    <div className="rounded-lg p-2.5 bg-blue-500/10 text-blue-500"><Upload className="h-5 w-5" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="section-label">Membership</p>
                      <div className="flex items-center gap-2 mt-1">
                        {planType ? (
                          <Badge variant={paymentStatus === 'active' ? 'default' : 'secondary'}>{planType}</Badge>
                        ) : (
                          <Badge variant="outline">No Plan</Badge>
                        )}
                        {paymentStatus === 'active' ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                      </div>
                    </div>
                    <div className="rounded-lg p-2.5 bg-green-500/10 text-green-500"><Star className="h-5 w-5" /></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Strip */}
            <div>
              <p className="section-label mb-3">Quick Actions</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {quickActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.path}
                      onClick={() => action.accessible && navigate(action.path)}
                      disabled={!action.accessible}
                      className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm whitespace-nowrap hover:bg-accent/10 hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-foreground">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content - 2 column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Access Cards */}
                <div>
                  <p className="section-label mb-3">Services</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Dispute Center', desc: 'Generate dispute letters', icon: Award, path: '/dispute-center', accessible: hasAccess('dispute-generator'), gate: 'Pro+' },
                      { label: 'Upload Credit Report', desc: 'Upload & analyze reports', icon: TrendingUp, path: '/upload-credit-report', accessible: hasAccess('credit-upload'), gate: 'Pro+' },
                      { label: 'AI Credit Assistant', desc: 'Get instant credit advice', icon: Sparkles, path: '/ai-assistant', accessible: hasAccess('dashboard'), gate: 'Basic+' },
                      { label: 'Education Center', desc: 'Learn credit strategies', icon: GraduationCap, path: '/education', accessible: hasAccess('education'), gate: 'Basic+' },
                      { label: 'Credit Building', desc: 'Grow your credit', icon: CreditCard, path: '/credit-building', accessible: true },
                      { label: 'Data Freeze', desc: 'Freeze 3rd-party data', icon: Lock, path: '/data-freeze', accessible: hasAccess('dispute-generator'), gate: 'Pro+' },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <Card
                          key={item.path}
                          className={`glass-card-hover cursor-pointer ${!item.accessible ? 'opacity-50' : ''}`}
                          onClick={() => item.accessible && navigate(item.path)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg p-2 bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                              <div>
                                <CardTitle className="text-sm">{item.label}</CardTitle>
                                <CardDescription className="text-xs">{item.desc}</CardDescription>
                              </div>
                            </div>
                            {!item.accessible && item.gate && <Badge variant="outline" className="mt-2 text-xs">{item.gate} Required</Badge>}
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Membership card */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-primary" />Membership</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {planType ? <Badge variant={paymentStatus === 'active' ? 'default' : 'secondary'}>{planType}</Badge> : <Badge variant="outline">No Plan</Badge>}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate('/membership')}>Manage</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Sign Agreement */}
                <Card className="glass-card-hover cursor-pointer" onClick={() => navigate('/onboarding')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2 bg-primary/10"><UserCheck className="h-5 w-5 text-primary" /></div>
                      <div><CardTitle className="text-sm">Sign Agreement</CardTitle><CardDescription className="text-xs">Complete your client agreement</CardDescription></div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Admin: Client Portals */}
                {isAdmin() && (
                  <Card className="glass-card-hover cursor-pointer" onClick={() => navigate('/client-portals')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg p-2 bg-primary/10"><User className="h-5 w-5 text-primary" /></div>
                        <div><CardTitle className="text-sm">Client Portals</CardTitle><CardDescription className="text-xs">Access individual client accounts</CardDescription></div>
                      </div>
                    </CardHeader>
                  </Card>
                )}

                {/* Tour card */}
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-semibold text-foreground">Need Help?</h3>
                    <p className="text-xs text-muted-foreground mb-3">Take our interactive tour</p>
                    <Button onClick={startTour} disabled={onboardingLoading} size="sm" variant="outline" className="w-full">
                      <Play className="h-4 w-4 mr-2" />Start Tour
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {shouldShowTour && !onboardingLoading && <OnboardingTour onComplete={completeTour} onSkip={skipTour} />}
      </div>
    );
  }

  // ═══════════ LANDING PAGE (unauthenticated) ═══════════
  return (
    <div className="min-h-screen bg-fintech-primary">
      <SEOHead />
      <div className="fixed top-4 right-4 z-50">
        <ThemeSelector />
      </div>
      <EngineerCredit position="top" />

      {/* Hero Section with Video Background */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/EXPRESS_CREDIT.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-primary/95 via-fintech-primary/75 to-fintech-secondary/85" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,195,232,0.3) 35px, rgba(0,195,232,0.3) 36px)' }} />

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center gap-12">
            <div className="text-center max-w-5xl animate-fade-in">
              <h1 className="font-poppins text-5xl md:text-6xl lg:text-7xl font-bold text-fintech-light mb-6 leading-tight">
                Fix Your Credit. Fund Your Business.
                <span className="block text-fintech-accent mt-2">Secure SBA Approval.</span>
              </h1>
              <p className="text-xl md:text-2xl text-fintech-light/90 mb-4 font-light">Express Credit makes it simple to get approved — credit repair + SBA loan automation, all in one portal.</p>
              <p className="text-lg md:text-xl text-fintech-light/70 mb-12 font-light">From credit repair to capital — we don't just fix scores, we fund dreams.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: Star, title: 'FCRA & CFPB Analysis', desc: 'Advanced credit file investigations by certified FCRA experts', key: 'fcra' },
                  { icon: Award, title: 'Legal Dispute Precision', desc: '95% success rate using verified legal methods', key: 'legal' },
                  { icon: TrendingUp, title: 'Rapid Turnaround', desc: 'See improvements in 15-30 days', key: 'rapid' },
                ].map(card => {
                  const Icon = card.icon;
                  return (
                    <div key={card.key} className="group cursor-pointer p-6 bg-fintech-primary/40 backdrop-blur-md rounded-xl border border-fintech-accent/30 hover:border-fintech-accent hover:bg-fintech-primary/60 transition-all duration-300 hover:scale-105" onClick={() => setModalContent(card.key as any)}>
                      <Icon className="h-12 w-12 text-fintech-accent mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="font-poppins font-semibold text-lg text-fintech-light mb-2">{card.title}</h3>
                      <p className="text-fintech-light/80 text-sm">{card.desc}</p>
                    </div>
                  );
                })}
              </div>

              {!showForms && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => setShowForms(true)} variant="fintech-primary" size="lg" className="text-lg px-10 py-6 h-auto">Get Started Today</Button>
                  <Button onClick={() => { setShowForms(true); setIsLogin(true); }} variant="fintech-outline" size="lg" className="text-lg px-10 py-6 h-auto">Client Login Portal</Button>
                </div>
              )}
            </div>

            {showForms && (
              <div className="animate-slide-up w-full max-w-md">
                <div className="bg-card/90 backdrop-blur-md rounded-xl border border-border p-8 shadow-2xl">
                  {isLogin ? <LoginForm onToggleForm={() => setIsLogin(false)} /> : <RegisterForm onToggleForm={() => setIsLogin(true)} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ContentModal isOpen={modalContent !== null} onClose={() => setModalContent(null)} content={modalContent || 'fcra'} />

      {/* Why Choose Us */}
      <div className="bg-fintech-primary py-20 border-t border-fintech-accent/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-poppins text-4xl md:text-5xl font-bold text-fintech-light mb-4">Why Choose <span className="text-fintech-accent">Express Credit?</span></h2>
            <p className="text-lg text-fintech-light/80 max-w-3xl mx-auto">Transform your financial future with our proven strategies and expert guidance</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Proven Results', desc: 'Thousands of clients have improved their credit scores with our expert methods' },
              { icon: Lock, title: 'Secure & Compliant', desc: 'FCRA compliant strategies that protect your rights and your data' },
              { icon: Clock, title: 'Fast Results', desc: 'See improvements in as little as 15-30 days with our rapid process' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center p-8 bg-fintech-secondary/50 backdrop-blur-sm rounded-xl border border-fintech-accent/20 hover:border-fintech-accent/50 transition-all duration-300 hover:scale-105">
                  <Icon className="h-16 w-16 text-fintech-accent mx-auto mb-4" />
                  <h3 className="font-poppins font-semibold text-xl text-fintech-light mb-3">{item.title}</h3>
                  <p className="text-fintech-light/70">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Membership Plans */}
      <div className="bg-fintech-support py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-poppins text-4xl md:text-5xl font-bold text-fintech-dark mb-4">Choose Your <span className="text-fintech-accent">Credit Solution</span></h2>
            <p className="text-lg text-fintech-dark/80 max-w-4xl mx-auto">Professional credit restoration services designed to help you achieve your financial goals.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            {[
              { title: 'Full Blown Credit Repair', price: '$1,499.99', badge: '👑 Elite Service', color: 'cyan', features: ['Full credit file audit & analysis', 'Targeted dispute preparation across all three bureaus', 'Inaccurate, unverifiable & outdated data challenges', 'Professional correspondence handled on your behalf', 'Consumer database review', 'Progress tracking inside client portal', 'FCRA-compliant processes'], plan: 'full-repair' },
              { title: 'Full ChexSystems Removal', price: '$349.99', badge: '🏦 Banking Access', color: 'emerald', features: ['ChexSystems consumer file review', 'Identification of inaccurate or unverifiable reporting', 'Professional dispute submission & follow-up', 'Support for banking access restoration', 'Secondary consumer reporting agency review', 'Secure documentation review', 'Client portal access with status tracking'], plan: 'chexsystems' },
              { title: 'Tradelines Add-Ons', price: '$499.99 – $1,499.99', badge: '⭐ Credit Enhancement', color: 'violet', features: ['Pricing varies by credit age, credit limit & reporting cycle', 'Personalized credit profile evaluation', 'Tradeline compatibility analysis', 'Education-based tradeline recommendations', 'Strategic integration guidance', 'Risk-aware placement strategy', 'Client consultation before implementation'], plan: 'tradelines' },
            ].map(plan => (
              <Card key={plan.plan} className="relative bg-card border-border hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-bold text-sm px-4 py-1 shadow-lg">{plan.badge}</Badge>
                </div>
                <CardHeader className="text-center pt-10">
                  <CardTitle className="font-poppins text-xl font-bold text-foreground">{plan.title}</CardTitle>
                  <div className={`${plan.plan === 'tradelines' ? 'text-2xl' : 'text-4xl'} font-bold text-primary mt-2`}>{plan.price}</div>
                  <div className="text-sm text-muted-foreground font-semibold">
                    {plan.plan === 'tradelines' ? 'Based on credit age, limit & reporting cycle' : 'One-Time Investment'}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 px-4">
                  <ul className="text-xs text-foreground/90 space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-primary font-bold">✓</span><span>{f}</span></li>
                    ))}
                  </ul>
                  <Button onClick={() => navigate(`/checkout?plan=${plan.plan}`)} className="w-full mt-4">Secure Enrollment</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <TrustSignals />
      <FAQSection />

      {/* Payment Methods */}
      <div className="bg-fintech-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="bg-fintech-primary/50 backdrop-blur-sm p-10 rounded-2xl border border-fintech-accent/30">
            <h3 className="font-poppins text-3xl font-bold text-center text-fintech-light mb-8">We Accept All Major <span className="text-fintech-accent">Payment Methods</span></h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 items-center justify-items-center mb-10">
              {[
                { src: '/lovable-uploads/607fa3b0-29f0-46a4-86de-39e4e8e1c245.png', alt: 'American Express' },
                { src: '/lovable-uploads/c74587ad-a808-43ca-b093-cdc6ac5585c8.png', alt: 'MasterCard' },
                { src: '/lovable-uploads/fc9628bb-8f09-450a-ae12-b97627dd735d.png', alt: 'Discover' },
                { src: '/lovable-uploads/057496bb-7585-4c04-94b2-85d91eb244ea.png', alt: 'Apple Pay' },
                { src: '/lovable-uploads/891a5755-258c-44d1-8553-249b16e50413.png', alt: 'Cash App' },
                { src: '/lovable-uploads/4068ca38-422c-424c-a722-661a31ecc1b8.png', alt: 'Affirm' },
                { src: '/lovable-uploads/b879e2a7-3060-4d30-8907-67cbecf22228.png', alt: 'Klarna' },
              ].map(img => <img key={img.alt} src={img.src} alt={img.alt} className="max-h-[38px] px-3 py-1 transition-all duration-300 hover:scale-110" />)}
              <VisaLogo />
            </div>
            <div className="text-center">
              <h4 className="font-poppins text-2xl font-bold text-fintech-accent mb-4">Flexible Payment Plans Available!</h4>
              <p className="text-fintech-light/80 mb-6 max-w-2xl mx-auto">We've partnered with industry-leading payment companies so you can get started today and pay your way</p>
            </div>
          </div>
        </div>
      </div>

      <EngineerCredit position="bottom" />
      <footer className="bg-fintech-primary py-10 border-t border-fintech-accent/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
              {['terms', 'privacy', 'refund'].map(p => (
                <button key={p} onClick={() => setPolicyModal(p as any)} className="text-fintech-light/70 hover:text-fintech-accent transition-colors text-sm font-medium">
                  {p === 'terms' ? 'Terms & Conditions' : p === 'privacy' ? 'Privacy Policy' : 'Refund Policy'}
                </button>
              ))}
            </div>
            <div className="text-sm text-fintech-light/60 text-center md:text-right">© 2024 Express Credit & Financial Solutions LLC. All rights reserved.</div>
          </div>
        </div>
      </footer>

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
            <div className="space-y-4 text-sm leading-relaxed text-foreground">
              {policyModal === 'terms' && <div><p className="mb-4">By accessing and using our website or subscribing to any service provided by Express Credit & Financial Solutions LLC ("we," "our," "us"), you agree to be bound by the following terms:</p><div className="space-y-3"><p><strong>Eligibility:</strong> You must be at least 18 years old.</p><p><strong>Services:</strong> We offer credit repair, financial education, and credit consulting services.</p><p><strong>Payments:</strong> Subscription fees are billed through our payment processor.</p><p><strong>Client Responsibility:</strong> You agree to provide accurate and truthful information.</p><p><strong>Communication:</strong> You consent to receive communications via email, phone, or SMS.</p><p><strong>Termination:</strong> We reserve the right to cancel your service if fraudulent behavior is detected.</p><p><strong>Disclaimers:</strong> We do not guarantee specific results or credit score increases.</p></div></div>}
              {policyModal === 'privacy' && <div><p className="mb-4">Your privacy is important to us:</p><div className="space-y-3"><p><strong>Information Collection:</strong> We collect personal data you voluntarily provide.</p><p><strong>Usage:</strong> Information is used to provide services and improve user experience.</p><p><strong>Security:</strong> We use SSL encryption and secure databases.</p><p><strong>Sharing:</strong> We do not sell or share your information with third parties unless required by law.</p><p><strong>Your Rights:</strong> You may request access, correction, or deletion of your data.</p></div></div>}
              {policyModal === 'refund' && <div><p className="mb-4">Our refund policy:</p><div className="space-y-3"><p><strong>No Refunds on Services Rendered:</strong> All sales are final once services have begun.</p><p><strong>Cancellation Policy:</strong> Clients may cancel any time.</p><p><strong>Billing Errors:</strong> Contact us within 7 days of the charge.</p></div></div>}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
