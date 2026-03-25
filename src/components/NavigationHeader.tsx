import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, CreditCard, GraduationCap, LogOut, Settings, Shield, Snowflake, TrendingUp, Sparkles, Menu, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeSelector } from '@/components/ThemeSelector';
import { cn } from '@/lib/utils';

export function NavigationHeader() {
  const { user, signOut, isAdmin } = useAuth();
  const { planType, paymentStatus, hasAccess } = useMembership();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPlanBadge = () => {
    if (paymentStatus !== 'active') return null;
    switch (planType) {
      case 'basic': return <Badge variant="default">Basic</Badge>;
      case 'pro': return <Badge variant="secondary">Pro</Badge>;
      case 'elite': return <Badge variant="outline">Elite</Badge>;
      case 'vip': return <Badge className="bg-primary text-primary-foreground">VIP</Badge>;
      default: return <Badge variant="secondary">Free</Badge>;
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home, accessible: hasAccess('dashboard') },
    { label: 'SBA Portal', path: '/sba-portal', icon: Shield, accessible: true },
    { label: 'Data Freeze', path: '/data-freeze', icon: Snowflake, accessible: hasAccess('dispute-generator') },
    { label: 'Dispute Center', path: '/dispute-center', icon: FileText, accessible: hasAccess('dispute-generator') },
    { label: 'Documents', path: '/documents', icon: CreditCard, accessible: hasAccess('credit-upload') },
    { label: 'Credit Report', path: '/upload-credit-report', icon: FileText, accessible: hasAccess('credit-upload') },
    { label: 'Education', path: '/education', icon: GraduationCap, accessible: hasAccess('education') },
    { label: 'Credit Building', path: '/credit-building', icon: TrendingUp, accessible: hasAccess('credit-building') },
    { label: 'Credit Monitoring', path: '/credit-monitoring', icon: TrendingUp, accessible: hasAccess('dashboard') },
    { label: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, accessible: hasAccess('dashboard') },
    { label: 'Membership', path: '/membership', icon: Settings, accessible: true },
  ];

  if (!user) return null;

  const NavLink = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { navigate(item.path); onClick?.(); }}
        disabled={!item.accessible}
        className={cn(
          'flex items-center gap-2 whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-accent/10 disabled:text-muted-foreground/40 rounded-lg px-3 py-2 transition-all',
          isActive && 'text-foreground bg-accent/10'
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger + Logo */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="p-4 border-b border-border">
                  <h2 className="font-poppins font-bold text-foreground">Express Credit</h2>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="p-2 space-y-1">
                  {navItems.map(item => (
                    <NavLink key={item.path} item={item} onClick={() => setMobileOpen(false)} />
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <span className="font-poppins font-bold text-foreground text-lg hidden sm:inline">Express Credit</span>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(item.path)}
                    disabled={!item.accessible}
                    className={cn(
                      'text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-accent/10 transition-all whitespace-nowrap disabled:text-muted-foreground/40',
                      isActive && 'text-foreground bg-accent/10'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {getPlanBadge()}
            {isAdmin && (
              <Shield className="h-4 w-4 text-primary" />
            )}
            <span className="hidden lg:block text-xs text-muted-foreground truncate max-w-32">
              {user.email}
            </span>
            <ThemeSelector />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
