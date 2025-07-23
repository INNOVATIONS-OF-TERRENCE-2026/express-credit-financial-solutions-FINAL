import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { ClientDashboard } from '@/components/ClientDashboard';
import { AdminPanel } from '@/components/AdminPanel';
import { Button } from '@/components/ui/button';
import { Shield, Star, Award, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';
type UserRole = 'client' | 'admin' | null;
const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserRole>(null);
  const [showForms, setShowForms] = useState(false);

  // Mock client data
  const mockClientData = {
    name: 'John Smith',
    email: 'john@email.com',
    membershipTier: 'monthly' as const,
    disputeProgress: 75,
    totalDisputes: 8,
    completedDisputes: 6,
    creditScore: 680,
    creditScoreChange: 25
  };
  const handleLogin = (email: string, password: string) => {
    // Mock authentication logic
    if (email === 'admin@expresscredit.com') {
      setCurrentUser('admin');
    } else {
      setCurrentUser('client');
    }
  };
  const handleRegister = (userData: any) => {
    // Mock registration logic
    console.log('Registering user:', userData);
    setCurrentUser('client');
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setShowForms(false);
  };
  const handleUploadDocument = () => {
    alert('Document upload functionality would be integrated with backend');
  };

  // Show appropriate dashboard based on user role
  if (currentUser === 'client') {
    return <ClientDashboard clientData={mockClientData} onUploadDocument={handleUploadDocument} onLogout={handleLogout} />;
  }
  if (currentUser === 'admin') {
    return <AdminPanel onLogout={handleLogout} />;
  }

  // Landing page with login/register forms
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
        <div className="absolute inset-0 bg-gradient-elegant opacity-80" />
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="flex flex-col items-center justify-center lg:items-start lg:justify-start mb-8">
                <div className="mb-6 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
                  <img 
                    src="/lovable-uploads/ba89249e-b0af-422c-81e0-5f107a0f0425.png" 
                    alt="Express Credit & Financial Solutions" 
                    className="h-32 w-auto filter drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl text-primary-foreground mb-2 font-bold mx-0 lg:text-5xl">
                    Express Credit & Financial Solutions
                  </h1>
                  <p className="text-xl text-primary-foreground/80">Professional Credit & Financial Solutions Services</p>
                </div>
              </div>
              
              <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl">Transform your financial future with our proven credit repair strategies. Our expert team has helped Thousands of clients improve their credit scores and achieve their financial goals.</p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

              {!showForms && <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button onClick={() => setShowForms(true)} variant="gold" size="lg" className="text-lg px-8 py-3">
                    Get Started Today
                  </Button>
                  <Button onClick={() => {
                setShowForms(true);
                setIsLogin(true);
              }} variant="silver" size="lg" className="text-lg px-8 py-3">Client Login Portal</Button>
                </div>}
            </div>

            {/* Login/Register Forms */}
            <div className="flex justify-center lg:justify-end">
              {showForms && <div className="animate-slide-up">
                  {isLogin ? <LoginForm onToggleForm={() => setIsLogin(false)} onLogin={handleLogin} /> : <RegisterForm onToggleForm={() => setIsLogin(true)} onRegister={handleRegister} />}
                </div>}
            </div>
          </div>

          {/* Quick Admin Access */}
          {showForms && <div className="text-center mt-8">
              <p className="text-primary-foreground/60 text-sm mb-2">
                Admin Access
              </p>
              <Button onClick={() => handleLogin('admin@expresscredit.com', 'admin')} variant="link" className="text-accent hover:text-accent/80">
                Admin Login (Demo)
              </Button>
            </div>}
        </div>
      </div>
    </div>;
};
export default Index;