import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, CreditCard, GraduationCap, LogOut, Settings, Shield, Snowflake, TrendingUp, Sparkles } from 'lucide-react';
export function NavigationHeader() {
  const {
    user,
    signOut,
    isAdmin
  } = useAuth();
  const {
    planType,
    paymentStatus,
    hasAccess
  } = useMembership();
  const navigate = useNavigate();
  const location = useLocation();
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  const getPlanBadge = () => {
    if (paymentStatus !== 'active') {
      return;
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
  const navItems = [{
    label: 'Dashboard',
    path: '/',
    icon: Home,
    accessible: hasAccess('dashboard')
  }, {
    label: 'Data Freeze',
    path: '/data-freeze',
    icon: Snowflake,
    accessible: hasAccess('dispute-generator')
  }, {
    label: 'Dispute Center',
    path: '/dispute-center',
    icon: FileText,
    accessible: hasAccess('dispute-generator')
  }, {
    label: 'Upload Documents',
    path: '/documents',
    icon: CreditCard,
    accessible: hasAccess('credit-upload')
  }, {
    label: 'Upload Credit Report',
    path: '/upload-credit-report',
    icon: FileText,
    accessible: hasAccess('credit-upload')
  }, {
    label: 'Education',
    path: '/education',
    icon: GraduationCap,
    accessible: hasAccess('education')
  }, {
    label: 'Credit Building',
    path: '/credit-building',
    icon: TrendingUp,
    accessible: hasAccess('credit-building')
  }, {
    label: 'Credit Monitoring',
    path: '/credit-monitoring',
    icon: TrendingUp,
    accessible: hasAccess('dashboard')
  }, {
    label: 'AI Assistant',
    path: '/ai-assistant',
    icon: Sparkles,
    accessible: hasAccess('dashboard')
  }, {
    label: 'Membership',
    path: '/membership',
    icon: Settings,
    accessible: true
  }];
  if (!user) return null;
  return <header className="sticky top-0 z-40 border-b bg-gradient-to-r from-blue-900 via-blue-800 to-yellow-600 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-blue-900/95 supports-[backdrop-filter]:via-blue-800/95 supports-[backdrop-filter]:to-yellow-600/95 animate-pulse">
      <div className="container mx-auto px-4 py-3 bg-inherit">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 lg:space-x-6 min-w-0">
            <div className="flex items-center space-x-2 flex-shrink-0">
              
            </div>
            
            <nav className="hidden md:flex items-center space-x-1 overflow-x-auto">
              {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return <Button key={item.path} variant={isActive ? "default" : "ghost"} size="sm" onClick={() => navigate(item.path)} disabled={!item.accessible} className="flex items-center space-x-2 whitespace-nowrap text-white hover:text-white hover:bg-white/20 disabled:text-white/50" style={{textShadow: '0 0 8px rgba(147, 51, 234, 0.8)'}}>
                    <Icon className="h-4 w-4" style={{filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.6))'}} />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>;
            })}
            </nav>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
            {getPlanBadge()}
            <div className="hidden lg:block text-sm text-white truncate max-w-32" style={{textShadow: '0 0 6px rgba(147, 51, 234, 0.7)'}}>
              {user.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="flex-shrink-0 border-white/30 text-white hover:text-white hover:bg-white/20 hover:border-white/50" style={{textShadow: '0 0 6px rgba(147, 51, 234, 0.7)'}}>
              <LogOut className="h-4 w-4" style={{filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.6))'}} />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
            {isAdmin && <Button onClick={() => navigate('/admin')} variant="default" size="sm" className="flex items-center bg-gradient-elegant flex-shrink-0 text-white" style={{textShadow: '0 0 6px rgba(147, 51, 234, 0.7)'}}>
                <Shield className="h-4 w-4 mr-2" style={{filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.6))'}} />
                <span className="hidden lg:inline">Admin</span>
              </Button>}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden mt-3 border-t border-white/20 pt-3">
          <div className="flex items-center space-x-1 overflow-x-auto pb-2">
            {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return <Button key={item.path} variant={isActive ? "default" : "ghost"} size="sm" onClick={() => navigate(item.path)} disabled={!item.accessible} className="flex items-center space-x-2 whitespace-nowrap flex-shrink-0 text-white hover:text-white hover:bg-white/20 disabled:text-white/50" style={{textShadow: '0 0 6px rgba(147, 51, 234, 0.7)'}}>
                  <Icon className="h-4 w-4" style={{filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.6))'}} />
                  <span className="text-xs">{item.label}</span>
                </Button>;
          })}
          </div>
        </div>
      </div>
    </header>;
}