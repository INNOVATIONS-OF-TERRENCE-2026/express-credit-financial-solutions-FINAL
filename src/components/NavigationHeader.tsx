import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, CreditCard, GraduationCap, LogOut, Settings } from 'lucide-react';

export function NavigationHeader() {
  const { user, signOut } = useAuth();
  const { planType, paymentStatus, hasAccess } = useMembership();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPlanBadge = () => {
    if (paymentStatus !== 'active') {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    switch (planType) {
      case 'Basic Package':
        return <Badge variant="default">Basic</Badge>;
      case 'Pro Package':
        return <Badge variant="secondary">Pro</Badge>;
      case 'Elite Package':
        return <Badge variant="outline">Elite</Badge>;
      case 'All Exclusive Package':
        return <Badge variant="destructive">Exclusive</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: Home,
      accessible: hasAccess('dashboard')
    },
    {
      label: 'Dispute Center',
      path: '/dispute-center',
      icon: FileText,
      accessible: hasAccess('dispute-generator')
    },
    {
      label: 'Upload Documents',
      path: '/documents',
      icon: CreditCard,
      accessible: hasAccess('credit-upload')
    },
    {
      label: 'Education',
      path: '/education',
      icon: GraduationCap,
      accessible: hasAccess('education')
    },
    {
      label: 'Membership',
      path: '/membership',
      icon: Settings,
      accessible: true
    }
  ];

  if (!user) return null;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/ba89249e-b0af-422c-81e0-5f107a0f0425.png" 
                alt="Express Credit" 
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg">Express Credit</span>
            </div>
            
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    disabled={!item.accessible}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {getPlanBadge()}
            <div className="hidden sm:block text-sm text-muted-foreground">
              {user.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}