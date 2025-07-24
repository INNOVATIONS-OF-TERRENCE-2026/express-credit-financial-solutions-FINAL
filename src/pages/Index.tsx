import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { NavigationHeader } from '@/components/NavigationHeader';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { ClientDashboard } from '@/components/ClientDashboard';
import { AdminPanel } from '@/components/AdminPanel';
import { Button } from '@/components/ui/button';
import { Shield, Star, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForms, setShowForms] = useState(false);
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
    toast
  } = useToast();
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
              <h1 className="text-3xl font-bold text-primary-foreground mb-2">
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

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className={hasAccess('dashboard') ? 'cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20' : 'opacity-50 bg-white/5 backdrop-blur-sm border-white/10'} onClick={() => hasAccess('dashboard') && navigate('/')}>
                <CardHeader className="text-center bg-transparent">
                  <Star className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Dashboard</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">View your credit overview</CardDescription>
                </CardHeader>
              </Card>

              <Card className={hasAccess('dispute-generator') ? 'cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20' : 'opacity-50 bg-white/5 backdrop-blur-sm border-white/10'} onClick={() => hasAccess('dispute-generator') && navigate('/dispute-center')}>
                <CardHeader className="text-center bg-transparent">
                  <Award className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Dispute Center</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Generate dispute letters</CardDescription>
                  {!hasAccess('dispute-generator') && <Badge variant="outline" className="mt-2 bg-white/20 text-primary-foreground border-white/30">Pro+ Required</Badge>}
                </CardHeader>
              </Card>

              <Card className={hasAccess('credit-upload') ? 'cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20' : 'opacity-50 bg-white/5 backdrop-blur-sm border-white/10'} onClick={() => hasAccess('credit-upload') && navigate('/documents')}>
                <CardHeader className="text-center bg-transparent">
                  <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
                  <CardTitle className="text-lg text-primary-foreground">Upload Documents</CardTitle>
                  <CardDescription className="text-primary-foreground/90 font-medium">Upload credit reports</CardDescription>
                  {!hasAccess('credit-upload') && <Badge variant="outline" className="mt-2 bg-white/20 text-primary-foreground border-white/30">Pro+ Required</Badge>}
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
            </div>
          </div>
        </main>
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
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Star className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="text-primary-foreground mb-1 font-semibold text-base">FCRA & CFPB Analysis</h3>
                  <p className="text-primary-foreground/80 text-sm">Advanced Credit File Investigations by Certified FCRA Experts: </p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Award className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold text-primary-foreground mb-1">Legal Dispute Precision</h3>
                  <p className="text-sm text-primary-foreground/80">95% success rate using verified methods</p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
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
      
      {/* Terms and Conditions */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
        <div className="container mx-auto px-4 flex justify-center">
          <p className="text-xs text-primary-foreground/70 leading-relaxed max-w-6xl text-center">
            We operate in full compliance with the Credit Repair Organizations Act (CROA), the Fair Credit Reporting Act (FCRA), and applicable state regulations. Express Credit & Financial Solutions provides educational resources and services related to credit repair, credit improvement strategies, and financial wellness. Results are not guaranteed and may vary based on individual credit profiles, creditor responses, and compliance with recommended actions. You understand and agree that improving your credit requires your active participation. This may include providing accurate information, forwarding correspondence from credit bureaus, and maintaining good financial habits. We do not assume liability for errors or omissions in the information you provide. All information you submit through this website is subject to our Privacy Policy. We do not sell, trade, or rent your personal data. By submitting your information, you authorize Express Credit & Financial Solutions to contact you via phone, SMS, or email regarding our services.
          </p>
        </div>
      </div>
    </div>;
};
export default Index;