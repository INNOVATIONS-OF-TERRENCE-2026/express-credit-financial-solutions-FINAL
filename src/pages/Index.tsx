import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { NavigationHeader } from '@/components/NavigationHeader';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { Button } from '@/components/ui/button';
import { Shield, Star, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForms, setShowForms] = useState(false);
  const { user, loading, signIn, signUp } = useAuth();
  const { planType, paymentStatus, hasAccess } = useMembership();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRegister = async (userData: any) => {
    const { error } = await signUp(userData.email, userData.password);
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-gradient-elegant opacity-80" />
        <NavigationHeader />
        <main className="relative z-10 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary-foreground mb-2">
                Welcome to Express Credit & Financial Solutions
              </h1>
              <p className="text-primary-foreground/80">
                Manage your credit repair journey and track your progress
              </p>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="bg-black">
                <CardTitle className="flex items-center gap-2 text-primary-foreground">
                  <Star className="h-5 w-5" /> Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-lime-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-foreground/60">Current Plan</p>
                    <div className="flex items-center gap-2">
                      {planType ? (
                        <Badge variant={paymentStatus === 'active' ? 'default' : 'secondary'}>{planType}</Badge>
                      ) : (
                        <Badge variant="outline">No Plan</Badge>
                      )}
                      <Badge variant={paymentStatus === 'active' ? 'default' : 'destructive'}>
                        {paymentStatus === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/membership')}
                    className="bg-white/10 text-primary-foreground border-white/20 hover:bg-white/20"
                  >
                    Manage Membership
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[{
                access: 'dashboard',
                icon: <Star className="h-8 w-8 text-accent mx-auto mb-2" />, title: 'Dashboard', desc: 'View your credit overview', route: '/'
              }, {
                access: 'dispute-generator',
                icon: <Award className="h-8 w-8 text-accent mx-auto mb-2" />, title: 'Dispute Center', desc: 'Generate dispute letters', route: '/dispute-center'
              }, {
                access: 'credit-upload',
                icon: <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />, title: 'Upload Documents', desc: 'Upload credit reports', route: '/documents'
              }, {
                access: 'education',
                icon: <Shield className="h-8 w-8 text-accent mx-auto mb-2" />, title: 'Education', desc: 'Learn credit strategies', route: '/education'
              }].map(({ access, icon, title, desc, route }) => (
                <Card
                  key={access}
                  className={hasAccess(access) ? 'cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20' : 'opacity-50 bg-white/5 backdrop-blur-sm border-white/10'}
                  onClick={() => hasAccess(access) && navigate(route)}
                >
                  <CardHeader className="text-center bg-transparent">
                    {icon}
                    <CardTitle className="text-lg text-primary-foreground">{title}</CardTitle>
                    <CardDescription className="text-primary-foreground/90 font-medium">{desc}</CardDescription>
                    {!hasAccess(access) && (
                      <Badge variant="outline" className="mt-2 bg-white/20 text-primary-foreground border-white/30">
                        {access === 'education' ? 'Basic+ Required' : 'Pro+ Required'}
                      </Badge>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-gradient-elegant opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <img
            src="/lovable-uploads/9e7b0b62-1d6a-4100-90af-cef2cfc9b187.png"
            alt="Background Logo"
            className="w-96 h-96 object-contain filter brightness-200 contrast-150 mix-blend-overlay"
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-12">
            <div className="text-center">
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="text-center">
                  <h1 className="text-4xl text-primary-foreground mb-2 font-bold mx-0 lg:text-5xl">
                    Express Credit & Financial Solutions
                  </h1>
                  <p className="text-xl text-primary-foreground/80">
                    Professional Credit & Financial Solutions Services
                  </p>
                </div>
              </div>
              <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Transform your financial future with our proven credit repair strategies.
              </p>
              {!showForms && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => setShowForms(true)} variant="gold" size="lg" className="text-lg px-8 py-3">
                    Get Started Today
                  </Button>
                  <Button
                    onClick={() => {
                      setShowForms(true);
                      setIsLogin(true);
                    }}
                    variant="silver"
                    size="lg"
                    className="text-lg px-8 py-3"
                  >
                    Client Login Portal
                  </Button>
                </div>
              )}
            </div>
            {showForms && (
              <div className="animate-slide-up flex justify-center">
                {isLogin ? (
                  <LoginForm onToggleForm={() => setIsLogin(false)} />
                ) : (
                  <RegisterForm onToggleForm={() => setIsLogin(true)} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
        <div className="container mx-auto px-4 flex justify-center">
          <p className="text-xs text-primary-foreground/70 leading-relaxed max-w-6xl text-center">
            We operate in full compliance with the Credit Repair Organizations Act (CROA)...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
