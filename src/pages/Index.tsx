import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { ClientDashboard } from '@/components/ClientDashboard';
import { AdminPanel } from '@/components/AdminPanel';
import { Button } from '@/components/ui/button';
import { Shield, Star, Award, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForms, setShowForms] = useState(false);
  const { user, profile, loading } = useAuth();

  const handleUploadDocument = () => {
    alert('Document upload functionality would be integrated with backend');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  // Show appropriate dashboard based on user role
  if (user && profile?.role === 'client') {
    return (
      <ClientDashboard
        onUploadDocument={handleUploadDocument}
      />
    );
  }

  if (user && profile?.role === 'admin') {
    return <AdminPanel />;
  }

  // Landing page with login/register forms
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-elegant opacity-80" />
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <Shield className="h-12 w-12 text-accent mr-4" />
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
                    Express Credit & Financial Solutions
                  </h1>
                  <p className="text-xl text-primary-foreground/80">
                    Professional Credit Repair Services
                  </p>
                </div>
              </div>
              
              <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl">
                Transform your financial future with our proven credit repair strategies. 
                Our expert team has helped thousands of clients improve their credit scores 
                and achieve their financial goals.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Star className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold text-primary-foreground mb-1">Expert Analysis</h3>
                  <p className="text-sm text-primary-foreground/80">Comprehensive credit report analysis</p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Award className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold text-primary-foreground mb-1">Proven Results</h3>
                  <p className="text-sm text-primary-foreground/80">87% success rate in score improvement</p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold text-primary-foreground mb-1">Fast Results</h3>
                  <p className="text-sm text-primary-foreground/80">See improvements in 30-60 days</p>
                </div>
              </div>

              {!showForms && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    onClick={() => setShowForms(true)}
                    variant="gold"
                    size="lg"
                    className="text-lg px-8 py-3"
                  >
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
                    Client Login
                  </Button>
                </div>
              )}
            </div>

            {/* Login/Register Forms */}
            <div className="flex justify-center lg:justify-end">
              {showForms && (
                <div className="animate-slide-up">
                  {isLogin ? (
                    <LoginForm
                      onToggleForm={() => setIsLogin(false)}
                    />
                  ) : (
                    <RegisterForm
                      onToggleForm={() => setIsLogin(true)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Index;
