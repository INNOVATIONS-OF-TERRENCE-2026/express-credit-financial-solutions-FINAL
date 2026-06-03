import { useState } from 'react';
import { VisaLogo } from '@/components/VisaLogo';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useRoles } from '@/hooks/useRoles';
import { NavigationHeader } from '@/components/NavigationHeader';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { Button } from '@/components/ui/button';
import { Shield, Star, Award, TrendingUp, CreditCard, Lock, FileText, UserCheck, Clock, Play, Upload, User, Sparkles, Snowflake, GraduationCap, CheckCircle2, ArrowRight, Zap, BarChart3, Bot, Send, Banknote, Check, X } from 'lucide-react';
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
    <div className="min-h-screen font-work" style={{ backgroundColor: '#f5f0e0', color: '#064e3b' }}>
      <SEOHead />
      <div className="fixed top-4 right-4 z-50"><ThemeSelector /></div>
      <EngineerCredit position="top" />

      {/* ═══════════ EDITORIAL PRESTIGE BENTO HERO ═══════════ */}
      <section className="px-6 sm:px-12 pt-8 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">

          {/* Hero Tile */}
          <div className="md:col-span-8 md:row-span-2 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden min-h-[560px]" style={{ backgroundColor: '#064e3b' }}>
            <div className="relative z-10">
              <h1 className="font-serif-display text-5xl md:text-7xl leading-[0.95] tracking-tight" style={{ color: '#f5f0e0' }}>
                Fix Your Credit. <br />
                Fund Your Business. <br />
                <span className="italic" style={{ color: '#c9a84c' }}>Secure SBA Approval.</span>
              </h1>
              <p className="mt-8 text-lg max-w-md font-light" style={{ color: 'rgba(245,240,224,0.8)' }}>
                Express Credit makes it simple to get approved — credit repair and SBA loan automation, integrated into one professional portal.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-4 relative z-10">
              <button onClick={() => setShowForms(true)} className="px-8 py-4 font-semibold uppercase tracking-widest text-xs transition-colors" style={{ backgroundColor: '#c9a84c', color: '#064e3b' }}>
                Get Started
              </button>
              <button onClick={() => { setShowForms(true); setIsLogin(true); }} className="border px-8 py-4 font-semibold uppercase tracking-widest text-xs transition-colors" style={{ borderColor: 'rgba(245,240,224,0.3)', color: '#f5f0e0' }}>
                Client Login
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full pointer-events-none" style={{ border: '0.5px solid rgba(201,168,76,0.2)' }} />
          </div>

          {/* Stat Tile — 95% */}
          <button onClick={() => setModalContent('legal')} className="md:col-span-4 p-8 flex flex-col justify-end text-left hover:opacity-90 transition-opacity" style={{ backgroundColor: '#c9a84c' }}>
            <span className="font-serif-display italic text-6xl leading-none" style={{ color: '#064e3b' }}>95%</span>
            <p className="font-semibold uppercase tracking-widest text-[10px] mt-2" style={{ color: '#064e3b' }}>Success Rate Precision</p>
          </button>

          {/* Rating Tile — 4.9/5 */}
          <div className="md:col-span-4 p-8 flex flex-col justify-between" style={{ backgroundColor: '#0d7a5f' }}>
            <div className="flex justify-between items-start w-full">
              <div className="font-serif-display text-xl" style={{ color: '#f5f0e0' }}>4.9/5</div>
              <div className="flex gap-0.5">
                {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c9a84c' }} />)}
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.4)' }} />
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
              247+ verified reviews from satisfied clients across Dallas and Texas.
            </p>
          </div>

          {/* Pricing — Full Credit Repair */}
          <div className="md:col-span-4 md:row-span-2 p-8 flex flex-col" style={{ backgroundColor: '#f5f0e0', border: '1px solid rgba(6,78,59,0.1)' }}>
            <div className="mb-8">
              <h3 className="font-serif-display text-3xl italic">Full Credit Repair</h3>
              <div className="text-4xl font-light tracking-tight mt-2" style={{ color: '#c9a84c' }}>$1,499.99</div>
              <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'rgba(6,78,59,0.5)' }}>One-Time Investment</p>
            </div>
            <ul className="space-y-4 mb-10">
              {['Full credit file audit & analysis','Targeted dispute preparation','Metro 2 compliant processes','FCRA-compliant correspondence'].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-light italic opacity-80">
                  <span style={{ color: '#c9a84c' }}>—</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/checkout?plan=full-repair')} className="mt-auto w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border" style={{ borderColor: '#064e3b', color: '#064e3b' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#064e3b'; e.currentTarget.style.color = '#f5f0e0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#064e3b'; }}>
              Secure Enrollment
            </button>
          </div>

          {/* Trust Pillars */}
          <div className="md:col-span-8 p-8 md:p-10" style={{ backgroundColor: '#064e3b' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { title: 'FCRA Analysis', desc: 'Advanced credit file investigations by certified experts.', key: 'fcra' as const },
                { title: 'Legal Precision', desc: '95% success rate using verified legal methods.', key: 'legal' as const },
                { title: 'Rapid Result', desc: 'See tangible improvements in as little as 15–30 days.', key: 'rapid' as const },
              ].map(p => (
                <button key={p.key} onClick={() => setModalContent(p.key)} className="text-left group">
                  <h4 className="font-serif-display text-xl italic mb-2 group-hover:underline underline-offset-4" style={{ color: '#c9a84c' }}>{p.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(245,240,224,0.6)' }}>{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ChexSystems Tile */}
          <button onClick={() => navigate('/checkout?plan=chexsystems')} className="md:col-span-3 p-8 text-left hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0d7a5f' }}>
            <h4 className="font-serif-display text-xl" style={{ color: '#f5f0e0' }}>ChexSystems</h4>
            <div className="text-2xl font-light mt-1" style={{ color: '#c9a84c' }}>$349.99</div>
            <p className="text-[10px] mt-4 uppercase tracking-tighter" style={{ color: 'rgba(245,240,224,0.5)' }}>Removal Service</p>
          </button>

          {/* Tradelines Tile */}
          <button onClick={() => navigate('/checkout?plan=tradelines')} className="md:col-span-3 p-8 text-left hover:opacity-90 transition-opacity" style={{ backgroundColor: '#064e3b' }}>
            <h4 className="font-serif-display text-xl" style={{ color: '#f5f0e0' }}>Tradelines</h4>
            <div className="text-2xl font-light mt-1" style={{ color: '#c9a84c' }}>$499+</div>
            <p className="text-[10px] mt-4 uppercase tracking-tighter" style={{ color: 'rgba(245,240,224,0.5)' }}>Credit Enhancement</p>
          </button>

          {/* Contact / Compliance */}
          <div className="md:col-span-6 p-8 flex flex-col justify-between" style={{ backgroundColor: '#f5f0e0', border: '1px solid #c9a84c' }}>
            <div className="flex justify-between items-start gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: '#c9a84c' }}>Headquarters</p>
                <address className="not-italic text-sm leading-relaxed" style={{ color: '#064e3b' }}>
                  6363 Dallas Pkwy, Frisco, TX 75034<br />
                  531-348-9321<br />
                  expresscreditfinancialsolution@gmail.com
                </address>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: '#c9a84c' }}>Compliance</p>
                <p className="text-[10px] opacity-70" style={{ color: '#064e3b' }}>Licensed & Insured<br />FCRA Certified<br />Metro 2 Compliant<br />Bank-Level Security</p>
              </div>
            </div>
          </div>

          {/* Footer stat bar */}
          <div className="md:col-span-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 mt-2" style={{ borderTop: '1px solid rgba(6,78,59,0.1)' }}>
            <div className="text-[10px] uppercase tracking-[0.3em] font-medium" style={{ color: 'rgba(6,78,59,0.4)' }}>
              Express Credit & Financial Solutions LLC — Established Precision
            </div>
            <div className="font-serif-display italic text-2xl" style={{ color: '#064e3b' }}>
              15–30 <span className="text-[10px] not-italic uppercase tracking-widest font-work font-bold align-middle ml-2">Day Turnaround</span>
            </div>
          </div>
        </div>
      </section>

      {/* Inline auth forms (revealed after CTA) */}
      {showForms && (
        <section className="px-6 sm:px-12 pb-12">
          <div className="max-w-md mx-auto p-8 shadow-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(6,78,59,0.1)' }}>
            {isLogin ? <LoginForm onToggleForm={() => setIsLogin(false)} /> : <RegisterForm onToggleForm={() => setIsLogin(true)} />}
          </div>
        </section>
      )}

      <ContentModal isOpen={modalContent !== null} onClose={() => setModalContent(null)} content={modalContent || 'fcra'} />

      {/* TrustSignals + FAQ wrapped in cream surround */}
      <div style={{ backgroundColor: '#f5f0e0' }}>
        <FAQSection />
      </div>

      {/* Payment Methods — emerald band */}
      <section className="px-6 sm:px-12 py-16" style={{ backgroundColor: '#064e3b' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>Flexible Payment Options</p>
            <h3 className="font-serif-display text-4xl md:text-5xl" style={{ color: '#f5f0e0' }}>
              We Accept <span className="italic" style={{ color: '#c9a84c' }}>All Major</span> Payment Methods
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 items-center justify-items-center mb-8 p-8" style={{ backgroundColor: 'rgba(245,240,224,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
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
          <p className="text-center text-sm font-light max-w-2xl mx-auto" style={{ color: 'rgba(245,240,224,0.7)' }}>
            Partnered with industry-leading payment companies — get started today and pay your way.
          </p>
        </div>
      </section>

      <EngineerCredit position="bottom" />

      {/* Footer */}
      <footer className="px-6 sm:px-12 py-10" style={{ backgroundColor: '#f5f0e0', borderTop: '1px solid rgba(6,78,59,0.1)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            {(['terms','privacy','refund'] as const).map(p => (
              <button key={p} onClick={() => setPolicyModal(p)} className="text-xs uppercase tracking-widest font-medium transition-colors hover:opacity-70" style={{ color: '#064e3b' }}>
                {p === 'terms' ? 'Terms & Conditions' : p === 'privacy' ? 'Privacy Policy' : 'Refund Policy'}
              </button>
            ))}
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-center md:text-right" style={{ color: 'rgba(6,78,59,0.5)' }}>© 2026 Express Credit & Financial Solutions LLC</div>
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
