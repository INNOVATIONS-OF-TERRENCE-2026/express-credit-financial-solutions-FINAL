import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMembership } from '@/hooks/useMembership';
import { useRoles } from '@/hooks/useRoles';
import { NavigationHeader } from '@/components/NavigationHeader';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { Button } from '@/components/ui/button';
import { Shield, Star, Award, TrendingUp, CreditCard, Lock, FileText, UserCheck, Clock, Play, Upload, User, Sparkles, Snowflake, GraduationCap, CheckCircle2, ArrowRight, Zap, BarChart3, Bot, Send, Banknote, Check, X, Facebook, ShieldCheck, KeyRound, FileLock2, Home as HomeIcon, Car, Key, Handshake, Building2, ExternalLink, ClipboardEdit } from 'lucide-react';
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

  // Stable session id for funnel attribution (per browser session)
  const getCtaSessionId = () => {
    try {
      let sid = sessionStorage.getItem('cta_session_id');
      if (!sid) {
        sid = (crypto as any)?.randomUUID?.() || `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('cta_session_id', sid);
      }
      return sid;
    } catch { return null; }
  };

  const logCtaEvent = async (event: string, cta_id: string, meta: Record<string, unknown> = {}) => {
    try {
      await supabase.from('marketing_cta_events').insert([{
        event,
        cta_id,
        session_id: getCtaSessionId() ?? undefined,
        user_id: user?.id ?? undefined,
        meta: meta as any,
      }]);
    } catch (e) {
      console.warn('cta db log failed', e);
    }
  };

  const trackCtaClick = (cta_id: string, meta: Record<string, unknown> = {}) => {
    try {
      const payload = { event: 'cta_click', cta_id, location: 'landing', ...meta, ts: new Date().toISOString() };
      const w = window as any;
      if (typeof w.gtag === 'function') w.gtag('event', 'cta_click', payload);
      if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload);
      if (w.fbq) w.fbq('trackCustom', 'CTAClick', payload);
      console.info('[cta]', payload);
      // Persist for admin funnel
      logCtaEvent('cta_click', cta_id, meta);
    } catch (e) {
      console.warn('cta tracking failed', e);
    }
  };

  // Fire end-to-end conversion event when a user finishes auth after clicking a tracked CTA
  const conversionFiredRef = useRef(false);
  useEffect(() => {
    if (!user || conversionFiredRef.current) return;
    let pendingCta: string | null = null;
    try { pendingCta = sessionStorage.getItem('pending_cta'); } catch { /* noop */ }
    if (!pendingCta) return;
    conversionFiredRef.current = true;
    const authMode = (() => { try { return sessionStorage.getItem('pending_cta_mode') || 'signup'; } catch { return 'signup'; } })();
    const eventName = authMode === 'login' ? 'login_completed' : 'signup_completed';
    const payload = { event: eventName, cta_id: pendingCta, location: 'landing', ts: new Date().toISOString() };
    const w = window as any;
    try {
      if (typeof w.gtag === 'function') w.gtag('event', eventName, payload);
      if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload);
      if (w.fbq) w.fbq('trackCustom', 'CTAConversion', payload);
    } catch { /* noop */ }
    console.info('[cta-conversion]', payload);
    logCtaEvent(eventName, pendingCta, { mode: authMode });
    try {
      sessionStorage.removeItem('pending_cta');
      sessionStorage.removeItem('pending_cta_mode');
    } catch { /* noop */ }
  }, [user]);

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
    <div className="min-h-screen font-work relative overflow-x-hidden" style={{ backgroundColor: '#03150f', color: '#f5f0e0' }}>
      <SEOHead />

      {/* Ambient atmospheric backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 0%, rgba(201,168,76,0.18), transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(13,122,95,0.35), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(6,78,59,0.55), transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(245,240,224,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,224,0.6) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />
      </div>

      {/* ═══════════ STICKY NAV ═══════════ */}
      <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: 'rgba(3,21,15,0.65)', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg,#c9a84c,#7a6020)' }}>
              <span className="font-serif-display text-lg italic" style={{ color: '#03150f' }}>E</span>
              <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: '#c9a84c' }} />
            </div>
            <div className="leading-tight">
              <p className="font-serif-display text-lg" style={{ color: '#f5f0e0' }}>Express Credit</p>
              <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: 'rgba(201,168,76,0.8)' }}>Financial Solutions</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(245,240,224,0.7)' }}>
            <a href="#tour" className="hover:text-white transition-colors">Process</a>
            <a href="#tiers" className="hover:text-white transition-colors">Service Options</a>
            <a href="#proof" className="hover:text-white transition-colors">Client Outcomes</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSelector />
            <button onClick={() => { setShowForms(true); setIsLogin(true); setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="px-4 sm:px-5 py-2.5 text-xs uppercase tracking-widest font-semibold rounded-full border transition-all" style={{ borderColor: 'rgba(201,168,76,0.35)', color: '#f5f0e0' }}>
              Client Portal Login
            </button>
            <button onClick={() => { setShowForms(true); setIsLogin(false); setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="px-4 sm:px-5 py-2.5 text-xs uppercase tracking-widest font-bold rounded-full transition-all relative group" style={{ backgroundColor: '#c9a84c', color: '#03150f', boxShadow: '0 0 24px rgba(201,168,76,0.4)' }}>
              Start My Credit Review
              <ArrowRight className="inline-block ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative z-10 px-6 sm:px-10 pt-16 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold mb-8" style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', color: '#c9a84c' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#c9a84c' }} />
              Private Client Credit Strategy
            </div>
            <h1 className="font-serif-display text-[2.75rem] sm:text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              Credit Restoration<br />
              Built for <span className="italic" style={{ color: '#c9a84c' }}>Funding Readiness.</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl max-w-xl font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.75)' }}>
              Express Credit & Financial Solutions helps clients organize, dispute, monitor, and strengthen their credit profile through a structured process designed for mortgage, auto, and business funding goals.
            </p>

            {/* Primary CTAs */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <button onClick={() => { setShowForms(true); setIsLogin(false); setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="group inline-flex items-center justify-center gap-2 px-8 py-5 rounded-full text-sm uppercase tracking-widest font-bold transition-all hover-scale" style={{ backgroundColor: '#c9a84c', color: '#03150f', boxShadow: '0 0 40px rgba(201,168,76,0.45)' }}>
                Start My Credit Review <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => { setShowForms(true); setIsLogin(true); setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="inline-flex items-center justify-center gap-2 px-8 py-5 rounded-full text-sm uppercase tracking-widest font-semibold border transition-all" style={{ borderColor: 'rgba(245,240,224,0.25)', color: '#f5f0e0', backgroundColor: 'rgba(245,240,224,0.04)' }}>
                Client Portal Login
              </button>
            </div>

            {/* Quick proof row */}
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl">
              {[
                { n: '2,400+', l: 'Client Files Reviewed' },
                { n: '18k+', l: 'Dispute Rounds Managed' },
                { n: '50 States', l: 'Nationwide Client Support' },
              ].map(s => (
                <div key={s.l}>
                  <div className="font-serif-display text-3xl md:text-4xl" style={{ color: '#c9a84c' }}>{s.n}</div>
                  <p className="text-[10px] uppercase tracking-[0.25em] mt-2 leading-relaxed" style={{ color: 'rgba(245,240,224,0.55)' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Animated Dashboard Preview */}
          <div className="lg:col-span-5 relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-2xl p-1 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.7), rgba(13,122,95,0.4), rgba(201,168,76,0.2))', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6), 0 0 60px rgba(201,168,76,0.25)' }}>
              <div className="rounded-2xl p-6 backdrop-blur-xl" style={{ backgroundColor: 'rgba(3,21,15,0.92)' }}>
                {/* window chrome */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#c9a84c' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.5)' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.25)' }} />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: 'rgba(201,168,76,0.7)' }}>Secure Client Portal</span>
                </div>

                {/* Score gauge */}
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(245,240,224,0.5)' }}>FICO Score · Experian</p>
                    <p className="font-serif-display text-6xl mt-1" style={{ color: '#f5f0e0' }}>742</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold flex items-center gap-1" style={{ color: '#c9a84c' }}><CheckCircle2 className="h-3 w-3" /> Tier · Good</p>
                    <p className="text-[10px]" style={{ color: 'rgba(245,240,224,0.5)' }}>Last updated · today</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full mb-6 overflow-hidden" style={{ backgroundColor: 'rgba(245,240,224,0.08)' }}>
                  <div className="h-full rounded-full animate-pulse" style={{ width: '82%', background: 'linear-gradient(90deg,#0d7a5f,#c9a84c)' }} />
                </div>

                {/* Mini bars */}
                <div className="grid grid-cols-7 gap-1.5 mb-6 h-20 items-end">
                  {[40,55,48,72,65,80,92].map((h,i) => (
                    <div key={i} className="rounded-t" style={{ height: `${h}%`, background: i === 6 ? '#c9a84c' : 'rgba(13,122,95,0.7)', animation: `fade-in 0.6s ease-out ${i * 0.08}s both` }} />
                  ))}
                </div>

                {/* Activity rows */}
                <div className="space-y-2.5">
                  {[
                    { icon: FileText, label: 'Credit file received · Equifax', status: 'Logged', color: '#c9a84c' },
                    { icon: ShieldCheck, label: 'Documentation review', status: 'In progress', color: '#0d7a5f' },
                    { icon: Send, label: 'Goodwill request · Capital One', status: 'Sent', color: 'rgba(245,240,224,0.5)' },
                  ].map((row, i) => {
                    const Icon = row.icon;
                    return (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(245,240,224,0.04)', border: '1px solid rgba(201,168,76,0.1)' }}>
                        <div className="flex items-center gap-2.5 text-xs" style={{ color: '#f5f0e0' }}>
                          <Icon className="h-3.5 w-3.5" style={{ color: row.color }} />
                          {row.label}
                        </div>
                        <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: row.color }}>{row.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-5 -left-5 px-4 py-3 rounded-xl backdrop-blur-xl animate-fade-in" style={{ animationDelay: '0.6s', backgroundColor: 'rgba(3,21,15,0.9)', border: '1px solid rgba(201,168,76,0.35)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" style={{ color: '#c9a84c' }} />
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: 'rgba(201,168,76,0.8)' }}>Secure Workspace</p>
                  <p className="text-xs font-bold" style={{ color: '#f5f0e0' }}>Encrypted document handling</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inline auth forms */}
      {showForms && (
        <section id="auth" className="relative z-10 px-6 sm:px-10 pb-16 -mt-4">
          <div className="max-w-md mx-auto rounded-2xl p-1" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.6), rgba(13,122,95,0.3))' }}>
            <div className="rounded-2xl p-8 backdrop-blur-xl" style={{ backgroundColor: 'rgba(3,21,15,0.95)' }}>
              {isLogin ? <LoginForm onToggleForm={() => setIsLogin(false)} /> : <RegisterForm onToggleForm={() => setIsLogin(true)} />}
            </div>
          </div>
        </section>
      )}

      <ContentModal isOpen={modalContent !== null} onClose={() => setModalContent(null)} content={modalContent || 'fcra'} />

      {/* ═══════════ METRICS STRIP ═══════════ */}
      <section className="relative z-10 px-5 sm:px-8 md:px-10 py-12 border-y" style={{ borderColor: 'rgba(201,168,76,0.15)', backgroundColor: 'rgba(6,78,59,0.25)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { n: '12,000+', l: 'Client Files Reviewed' },
              { n: '48,000+', l: 'Dispute Rounds Managed' },
              { n: 'Mortgage · Auto · Business', l: 'Funding Readiness Support' },
              { n: '50 States', l: 'Nationwide Client Support' },
            ].map((m) => (
              <div key={m.l}>
                <div className="font-serif-display text-2xl md:text-4xl leading-tight" style={{ color: '#c9a84c' }}>{m.n}</div>
                <p className="text-[10px] uppercase tracking-[0.3em] mt-3 leading-relaxed" style={{ color: 'rgba(245,240,224,0.65)' }}>{m.l}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] uppercase tracking-[0.25em] mt-8" style={{ color: 'rgba(245,240,224,0.4)' }}>
            Figures represent service activity. Outcomes vary by client profile and reporting accuracy.
          </p>
        </div>
      </section>

      {/* ═══════════ PRODUCT TOUR ═══════════ */}
      <section id="tour" className="relative z-10 px-5 sm:px-8 md:px-10 py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>Our Process</p>
            <h2 className="font-serif-display text-3xl sm:text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Our Credit <span className="italic" style={{ color: '#c9a84c' }}>Readiness Process.</span>
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
              A structured five-step engagement, from initial credit file review through funding readiness support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { n: '01', icon: FileText, title: 'Credit File Review', desc: 'Tri-bureau report intake, secure document collection, and baseline profile assessment.' },
              { n: '02', icon: ClipboardEdit, title: 'Strategy & Documentation', desc: 'Personalized restoration roadmap with prioritized items, required documentation, and timelines.' },
              { n: '03', icon: Send, title: 'Dispute Preparation', desc: 'FCRA-aligned dispute drafting, Metro 2 formatting review, and certified mail dispatch.' },
              { n: '04', icon: BarChart3, title: 'Progress Tracking', desc: 'Bureau response logging, round-by-round status, and updated score monitoring inside the client portal.' },
              { n: '05', icon: Banknote, title: 'Funding Readiness Support', desc: 'Profile structuring guidance for mortgage, auto, and business financing conversations.' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.n} className="group relative p-7 rounded-2xl transition-all hover:-translate-y-1" style={{ backgroundColor: 'rgba(6,78,59,0.4)', border: '1px solid rgba(201,168,76,0.18)', backdropFilter: 'blur(8px)' }}>
                  <div className="absolute top-4 right-4 font-serif-display text-2xl italic" style={{ color: 'rgba(201,168,76,0.4)' }}>{step.n}</div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
                    <Icon className="h-5 w-5" style={{ color: '#c9a84c' }} />
                  </div>
                  <h3 className="font-serif-display text-xl md:text-2xl mb-3 leading-snug">{step.title}</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>{step.desc}</p>
                  {i < 4 && (
                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-30 group-hover:opacity-100 transition-opacity" style={{ color: '#c9a84c' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ MEMBERSHIP TIERS ═══════════ */}
      <section id="tiers" className="relative z-10 px-5 sm:px-8 md:px-10 py-16 sm:py-20 md:py-24" style={{ background: 'linear-gradient(180deg, transparent, rgba(6,78,59,0.4), transparent)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>Service Options</p>
            <h2 className="font-serif-display text-3xl sm:text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Service <span className="italic" style={{ color: '#c9a84c' }}>Options.</span>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-base font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
              Transparent engagement options selected based on the scope of your credit profile and financial goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'ChexSystems Removal', price: '$349.99', tagline: 'Banking Access Restoration', plan: 'chexsystems',
                features: [{ t: 'ChexSystems file review', y: true }, { t: 'Dispute submission & follow-up', y: true }, { t: 'Banking access restoration', y: true }, { t: 'Tri-bureau credit repair', y: false }, { t: 'SBA loan automation', y: false }, { t: 'Dedicated success manager', y: false }],
                featured: false,
              },
              {
                name: 'Full Credit Restoration', price: '$1,499.99', tagline: 'Comprehensive Engagement', plan: 'full-repair',
                features: [{ t: 'ChexSystems file review', y: true }, { t: 'Dispute preparation & follow-up', y: true }, { t: 'Banking access restoration', y: true }, { t: 'Tri-bureau credit restoration', y: true }, { t: 'Funding readiness support', y: true }, { t: 'Dedicated client advisor', y: true }],
                featured: true,
              },
              {
                name: 'Tradelines Add-On', price: '$499–$1,499', tagline: 'Profile Strengthening', plan: 'tradelines',
                features: [{ t: 'Credit profile evaluation', y: true }, { t: 'Tradeline compatibility analysis', y: true }, { t: 'Strategic placement guidance', y: true }, { t: 'Tri-bureau credit restoration', y: false }, { t: 'Funding readiness support', y: false }, { t: 'Dedicated client advisor', y: false }],
                featured: false,
              },
            ].map((tier) => (
              <div key={tier.plan} className="relative rounded-2xl p-1 transition-all hover:-translate-y-2" style={{ background: tier.featured ? 'linear-gradient(135deg,#c9a84c,#0d7a5f,#c9a84c)' : 'rgba(201,168,76,0.15)', boxShadow: tier.featured ? '0 30px 60px -20px rgba(201,168,76,0.5)' : 'none' }}>
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] uppercase tracking-[0.3em] font-bold z-10" style={{ backgroundColor: '#c9a84c', color: '#03150f' }}>Most Selected</div>
                )}
                <div className="rounded-2xl p-10 h-full flex flex-col" style={{ backgroundColor: 'rgba(3,21,15,0.95)' }}>
                  <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: tier.featured ? '#c9a84c' : 'rgba(245,240,224,0.5)' }}>{tier.tagline}</p>
                  <h3 className="font-serif-display text-3xl mb-4">{tier.name}</h3>
                  <div className="font-serif-display text-5xl mb-1" style={{ color: tier.featured ? '#c9a84c' : '#f5f0e0' }}>{tier.price}</div>
                  <p className="text-[10px] uppercase tracking-[0.3em] mb-8" style={{ color: 'rgba(245,240,224,0.4)' }}>One-Time Engagement Fee</p>

                  <ul className="space-y-3.5 mb-10 flex-1">
                    {tier.features.map((f) => (
                      <li key={f.t} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: f.y ? '#f5f0e0' : 'rgba(245,240,224,0.35)' }}>
                        {f.y ? <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#c9a84c' }} /> : <X className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        <span className={f.y ? '' : 'line-through'}>{f.t}</span>
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => navigate(`/checkout?plan=${tier.plan}`)} className="w-full py-4 rounded-full text-xs uppercase tracking-[0.2em] font-bold transition-all" style={tier.featured ? { backgroundColor: '#c9a84c', color: '#03150f', boxShadow: '0 0 30px rgba(201,168,76,0.4)' } : { border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c' }}>
                    Begin Enrollment
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout compliance + prominent CTA */}
          <div className="mt-12 rounded-2xl p-1" style={{ background: 'linear-gradient(135deg,#c9a84c,#0d7a5f,#c9a84c)' }}>
            <div className="rounded-2xl p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center" style={{ backgroundColor: 'rgba(3,21,15,0.96)' }}>
              <div className="lg:col-span-2">
                <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: '#c9a84c' }}>Secure Checkout · PCI-DSS Compliant</p>
                <h3 className="font-serif-display text-3xl md:text-4xl tracking-tight leading-tight" style={{ color: '#f5f0e0' }}>
                  Ready to begin? <span className="italic" style={{ color: '#c9a84c' }}>Onboarding starts within one business day.</span>
                </h3>
                <p className="mt-4 text-sm font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
                  Enrollment includes a structured onboarding call and secure document collection so your credit file review can begin promptly.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {[
                    { Icon: Lock, t: '256-bit SSL' },
                    { Icon: ShieldCheck, t: 'PCI-DSS' },
                    { Icon: KeyRound, t: 'Encrypted Payments' },
                    { Icon: FileLock2, t: 'GLBA Privacy' },
                    { Icon: Shield, t: 'SOC-Grade Hosting' },
                  ].map(({ Icon, t }) => (
                    <div key={t} className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: '#c9a84c' }} />
                      <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(245,240,224,0.85)' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setShowForms(true); setIsLogin(false); setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="w-full px-8 py-5 rounded-full text-sm uppercase tracking-widest font-bold transition-all hover-scale flex items-center justify-center gap-2" style={{ backgroundColor: '#c9a84c', color: '#03150f', boxShadow: '0 0 40px rgba(201,168,76,0.5)' }}>
                  Start My Credit Review <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => { setShowForms(true); setIsLogin(true); setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="w-full px-8 py-4 rounded-full text-xs uppercase tracking-widest font-semibold border transition-all" style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#f5f0e0' }}>
                  Client Portal Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="proof" className="relative z-10 px-5 sm:px-8 md:px-10 py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>Client Progress & Outcomes</p>
            <h2 className="font-serif-display text-3xl sm:text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Client Progress & <span className="italic" style={{ color: '#c9a84c' }}>Outcomes.</span>
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
              A snapshot of recent client engagements. Results vary by client profile, documentation, creditor response, and reporting accuracy.
            </p>
          </div>

          {/* Headline metric: $1.8M removed */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-4 gap-px rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(201,168,76,0.2)' }}>
            {[
              { k: '2,400+', l: 'Active Client Files' },
              { k: '48,000+', l: 'Dispute Rounds Managed' },
              { k: '50 States', l: 'Nationwide Client Support' },
              { k: '90–180 Days', l: 'Average Engagement Length' },
            ].map((m) => (
              <div key={m.l} className="p-8 text-center" style={{ backgroundColor: 'rgba(3,21,15,0.92)' }}>
                <p className="font-serif-display text-2xl md:text-4xl leading-tight" style={{ color: '#c9a84c' }}>{m.k}</p>
                <p className="text-[10px] uppercase tracking-[0.3em] mt-3 leading-relaxed" style={{ color: 'rgba(245,240,224,0.65)' }}>{m.l}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[
              { name: 'Marcus J.', city: 'Dallas, TX', quote: '"The team walked me through every step of my credit file review and helped me prepare the documentation my loan officer needed. Communication was steady and professional from day one."', metric: 'Mortgage Readiness', plan: 'Full Credit Restoration' },
              { name: 'Daniela R.', city: 'Atlanta, GA', quote: '"I had been declined by multiple banks because of ChexSystems. The team explained the process clearly, supported the disputes, and I was able to open a business checking account."', metric: 'Banking Restored', plan: 'ChexSystems Removal' },
              { name: 'Travis B.', city: 'Phoenix, AZ', quote: '"The portal made it easy to follow what was being submitted and when. The structured approach took the guesswork out of preparing my profile for auto financing."', metric: 'Auto Financing', plan: 'Full Credit Restoration' },
            ].map((t, i) => (
              <div key={t.name} className="p-8 rounded-2xl transition-all hover:-translate-y-1" style={{ backgroundColor: 'rgba(6,78,59,0.4)', border: '1px solid rgba(201,168,76,0.2)', backdropFilter: 'blur(8px)', animationDelay: `${i * 0.1}s` }}>
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4" style={{ color: '#c9a84c', fill: '#c9a84c' }} />)}
                </div>
                <p className="font-serif-display text-lg md:text-xl leading-relaxed mb-6" style={{ color: '#f5f0e0' }}>{t.quote}</p>
                <div className="flex items-end justify-between pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(245,240,224,0.5)' }}>{t.city} · {t.plan}</p>
                  </div>
                  <p className="font-serif-display italic text-base md:text-lg text-right" style={{ color: '#c9a84c' }}>{t.metric}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] uppercase tracking-[0.25em] mb-16 leading-relaxed" style={{ color: 'rgba(245,240,224,0.45)' }}>
            Individual results vary. Testimonials reflect personal client experiences and are not guarantees of similar outcomes.
          </p>

          {/* Compliance / Security badges */}
          <div className="rounded-2xl p-8 md:p-10" style={{ backgroundColor: 'rgba(3,21,15,0.6)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <p className="text-center text-[10px] uppercase tracking-[0.3em] mb-8" style={{ color: 'rgba(201,168,76,0.85)' }}>Security, Privacy & Compliance</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { icon: Shield, label: 'FCRA-Aligned Process' },
                { icon: Lock, label: 'Secure Client Portal' },
                { icon: FileLock2, label: 'Encrypted Document Handling' },
                { icon: KeyRound, label: 'Privacy-First File Management' },
                { icon: CheckCircle2, label: 'Structured Documentation Review' },
              ].map(b => {
                const Icon = b.icon;
                return (
                  <div key={b.label} className="flex flex-col items-center text-center gap-3 p-5 rounded-xl transition-all hover-scale" style={{ backgroundColor: 'rgba(245,240,224,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
                    <Icon className="h-7 w-7" style={{ color: '#c9a84c' }} />
                    <p className="text-[10px] uppercase tracking-[0.25em] font-semibold leading-relaxed" style={{ color: 'rgba(245,240,224,0.85)' }}>{b.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MORTGAGE READINESS ═══════════ */}
      <section id="home-loans" className="relative z-10 px-5 sm:px-8 md:px-10 py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>Mortgage Readiness Support</p>
            <h2 className="font-serif-display text-3xl sm:text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Mortgage <span className="italic" style={{ color: '#c9a84c' }}>Readiness Support.</span>
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
              Credit profile structuring and lender documentation support for the mortgage conversation, coordinated alongside your selected loan officer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: HomeIcon, title: 'Credit Profile Structuring', desc: 'Account mix, utilization, and derogatory review sequenced for mortgage scorecards (FICO 2/4/5).' },
              { icon: FileText, title: 'Lender Documentation Support', desc: 'Documentation review, credit explanation letters, and pre-application preparation alongside your loan officer.' },
              { icon: Handshake, title: 'Coordinated Engagement', desc: 'We coordinate with your selected loan officer through the application process so questions are addressed promptly.' },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="p-8 md:p-10 rounded-2xl transition-all hover:-translate-y-1" style={{ backgroundColor: 'rgba(6,78,59,0.4)', border: '1px solid rgba(201,168,76,0.2)', backdropFilter: 'blur(8px)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
                    <Icon className="h-5 w-5" style={{ color: '#c9a84c' }} />
                  </div>
                  <h3 className="font-serif-display text-2xl mb-3 leading-snug">{p.title}</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>{p.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Tiara Smith — Dedicated Spotlight */}
          <div className="rounded-2xl p-1 mb-10" style={{ background: 'linear-gradient(135deg,#c9a84c,#0d7a5f,#c9a84c)', boxShadow: '0 30px 80px -20px rgba(201,168,76,0.35)' }}>
            <div className="rounded-2xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center" style={{ backgroundColor: 'rgba(3,21,15,0.96)' }}>
              {/* Left: Giant Key Visual + Name */}
              <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '2px solid rgba(201,168,76,0.4)', boxShadow: '0 0 40px rgba(201,168,76,0.15)' }}>
                  <Key className="h-10 w-10" style={{ color: '#c9a84c' }} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: '#c9a84c' }}>Featured Realtor Partner · Texas</p>
                <h3 className="font-serif-display text-4xl md:text-5xl tracking-tight" style={{ color: '#f5f0e0' }}>
                  Tiara Smith
                </h3>
                <p className="mt-2 font-serif-display text-2xl md:text-3xl italic" style={{ color: '#c9a84c' }}>
                  Tiara Has The Key
                </p>
              </div>

              {/* Center: Story / Value prop */}
              <div className="lg:col-span-4">
                <p className="text-base font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.75)' }}>
                  Once your credit profile is ready, Tiara guides clients through the home-buying process from pre-approval to closing, coordinating with our team on documentation and timing.
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <Award className="h-4 w-4" style={{ color: '#c9a84c' }} />
                  <span className="text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: 'rgba(245,240,224,0.85)' }}>Featured Real Estate Partner</span>
                </div>
              </div>

              {/* Right: CTAs */}
              <div className="lg:col-span-3 flex flex-col gap-3">
                <a onClick={() => trackCtaClick('tiara_website', { href: 'https://www.tiarahasthekey.com' })} href="https://www.tiarahasthekey.com" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-center gap-2 px-6 py-5 rounded-full text-sm uppercase tracking-widest font-bold transition-all hover-scale" style={{ backgroundColor: '#c9a84c', color: '#03150f', boxShadow: '0 0 40px rgba(201,168,76,0.4)' }}>
                  <Key className="h-4 w-4" /> Visit TiaraHasTheKey.com
                </a>
                <a onClick={() => trackCtaClick('tiara_zillow', { href: 'https://www.zillow.com/profile/tiarahasthekey' })} href="https://www.zillow.com/profile/tiarahasthekey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-xs uppercase tracking-widest font-semibold border transition-all" style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#f5f0e0' }}>
                  View Zillow Profile <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Brokerage + banking partners */}
          <div className="rounded-2xl p-8 md:p-10" style={{ backgroundColor: 'rgba(3,21,15,0.6)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-4 w-4" style={{ color: '#c9a84c' }} />
              <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(201,168,76,0.85)' }}>Brokerage & Lending Partners</p>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              {['United Real Estate', 'Keller Williams Realty', 'Coldwell Banker', 'eXp Realty', 'Compass'].map((b) => (
                <span key={b} className="px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', color: '#f5f0e0' }}>
                  {b}
                </span>
              ))}
            </div>
            <p className="text-sm font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
              Working relationships with <span style={{ color: '#c9a84c' }}>banks and credit unions</span> for mortgage, auto, and business financing conversations.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ AUTO FINANCING PREPARATION ═══════════ */}
      <section id="auto-loans" className="relative z-10 px-5 sm:px-8 md:px-10 py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-16 max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-4">
              <Car className="h-4 w-4" style={{ color: '#c9a84c' }} />
              <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#c9a84c' }}>Auto Financing Preparation</p>
            </div>
            <h2 className="font-serif-display text-3xl sm:text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Auto Financing <span className="italic" style={{ color: '#c9a84c' }}>Preparation.</span>
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
              Credit profile positioning and lender documentation review to support auto financing conversations with dealers and credit unions.
            </p>
          </div>

          {/* Step-by-step process */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { n: '01', icon: TrendingUp, title: 'Auto Scorecard Review', desc: 'Review of FICO Auto Score 8/9 factors, utilization ratios, and account age relevant to auto lender scorecards.' },
              { n: '02', icon: FileText, title: 'Debt & Utilization Cleanup', desc: 'Guidance on pay-down sequencing and dispute preparation to support a healthier debt-to-income presentation.' },
              { n: '03', icon: CheckCircle2, title: 'Lender Documentation Support', desc: 'Verification documents, credit explanation letters, and pre-application packets prepared before lender conversations.' },
              { n: '04', icon: Handshake, title: 'Credit Union & Dealer Coordination', desc: 'A better-prepared profile presented to your selected dealer or credit union for the financing conversation.' },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.n} className="group relative p-7 rounded-2xl transition-all hover:-translate-y-1" style={{ backgroundColor: 'rgba(6,78,59,0.4)', border: '1px solid rgba(201,168,76,0.18)', backdropFilter: 'blur(8px)' }}>
                  <div className="absolute top-4 right-4 font-serif-display text-2xl italic" style={{ color: 'rgba(201,168,76,0.4)' }}>{step.n}</div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
                    <Icon className="h-5 w-5" style={{ color: '#c9a84c' }} />
                  </div>
                  <h3 className="font-serif-display text-xl mb-3 leading-snug">{step.title}</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* CTA bar */}
          <div className="rounded-2xl p-1" style={{ background: 'linear-gradient(135deg,#c9a84c,#0d7a5f,#c9a84c)' }}>
            <div className="rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6" style={{ backgroundColor: 'rgba(3,21,15,0.96)' }}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: '#c9a84c' }}>Next Step</p>
                <h4 className="font-serif-display text-2xl md:text-3xl tracking-tight leading-snug" style={{ color: '#f5f0e0' }}>
                  Ready to prepare your auto financing file?
                </h4>
                <p className="mt-2 text-sm font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
                  Enrollment includes a structured onboarding call and document collection within one business day.
                </p>
              </div>
              <button onClick={() => { try { sessionStorage.setItem('pending_cta', 'start_my_auto_file'); sessionStorage.setItem('pending_cta_mode', 'signup'); } catch { /* noop */ } trackCtaClick('start_my_auto_file', { destination: 'signup' }); setShowForms(true); setIsLogin(false); setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="px-10 py-5 rounded-full text-sm uppercase tracking-widest font-bold transition-all hover-scale flex items-center justify-center gap-2 whitespace-nowrap" style={{ backgroundColor: '#c9a84c', color: '#03150f', boxShadow: '0 0 40px rgba(201,168,76,0.4)' }}>
                Start My Auto File <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <div id="faq" className="relative z-10"><FAQSection /></div>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative z-10 px-5 sm:px-8 md:px-10 py-16 sm:py-20 md:py-24">
        <div className="max-w-5xl mx-auto rounded-3xl p-1" style={{ background: 'linear-gradient(135deg,#c9a84c,#0d7a5f,#c9a84c)', boxShadow: '0 40px 80px -20px rgba(201,168,76,0.4)' }}>
          <div className="rounded-3xl p-12 md:p-16 text-center" style={{ backgroundColor: 'rgba(3,21,15,0.95)' }}>
            <h3 className="font-serif-display text-3xl sm:text-4xl md:text-6xl tracking-tight leading-[1.05] leading-tight">
              Begin your <br />
              <span className="italic" style={{ color: '#c9a84c' }}>credit readiness review.</span>
            </h3>
            <p className="mt-8 text-lg font-light max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(245,240,224,0.75)' }}>
              Schedule a structured onboarding call and begin secure document collection within one business day.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => { setShowForms(true); setIsLogin(false); setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="px-10 py-5 rounded-full text-sm uppercase tracking-widest font-bold transition-all hover-scale" style={{ backgroundColor: '#c9a84c', color: '#03150f', boxShadow: '0 0 40px rgba(201,168,76,0.5)' }}>
                Start My Credit Review
              </button>
              <button onClick={() => navigate('/membership')} className="px-10 py-5 rounded-full text-sm uppercase tracking-widest font-semibold border transition-all" style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#f5f0e0' }}>
                View Service Options
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="relative z-10 px-5 sm:px-8 md:px-10 py-10 border-t" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
        {/* Facebook community strip */}
        <div className="max-w-7xl mx-auto mb-10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ backgroundColor: 'rgba(6,78,59,0.45)', border: '1px solid rgba(201,168,76,0.25)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.35)' }}>
              <Facebook className="h-5 w-5" style={{ color: '#c9a84c' }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#c9a84c' }}>Stay Connected</p>
              <p className="font-serif-display text-2xl md:text-3xl tracking-tight leading-snug" style={{ color: '#f5f0e0' }}>
                Connect with Express Credit & <span className="italic" style={{ color: '#c9a84c' }}>Financial Solutions.</span>
              </p>
            </div>
          </div>
          <a
            href="https://www.facebook.com/ExpressCreditFinancial"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs uppercase tracking-widest font-bold transition-all hover-scale"
            style={{ backgroundColor: '#c9a84c', color: '#03150f', boxShadow: '0 0 30px rgba(201,168,76,0.4)' }}
          >
            <Facebook className="h-4 w-4" /> Visit Our Facebook
          </a>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <p className="font-serif-display text-xl">Express Credit & Financial Solutions</p>
            <p className="text-[10px] uppercase tracking-[0.3em] mt-2 leading-relaxed" style={{ color: 'rgba(245,240,224,0.5)' }}>6363 Dallas Pkwy · Frisco, TX · 531-348-9321</p>
            <a href="https://www.facebook.com/ExpressCreditFinancial" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-[10px] uppercase tracking-[0.3em] transition-colors hover:text-white" style={{ color: 'rgba(245,240,224,0.6)' }}>
              <Facebook className="h-3 w-3" /> Facebook
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {(['terms','privacy','refund'] as const).map(p => (
              <button key={p} onClick={() => setPolicyModal(p)} className="text-[10px] uppercase tracking-[0.3em] font-medium transition-colors hover:text-white" style={{ color: 'rgba(245,240,224,0.6)' }}>
                {p === 'terms' ? 'Terms' : p === 'privacy' ? 'Privacy' : 'Refund'}
              </button>
            ))}
            <button
              onClick={() => { setShowForms(true); setIsLogin(true); setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
              className="text-[10px] uppercase tracking-[0.3em] font-medium transition-colors hover:text-white"
              style={{ color: 'rgba(245,240,224,0.6)' }}
            >
              Client Portal
            </button>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-center md:text-right" style={{ color: 'rgba(245,240,224,0.4)' }}>© 2026 Express Credit LLC</p>
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
