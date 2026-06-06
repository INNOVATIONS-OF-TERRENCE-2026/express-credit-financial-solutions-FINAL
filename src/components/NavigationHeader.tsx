import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, CreditCard, LogOut, Settings, Shield, Menu, Search, LayoutDashboard, Wallet } from 'lucide-react';
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
    { label: 'Home', path: '/', icon: Home, accessible: true },
    { label: 'Client Portal', path: '/client/dashboard', icon: LayoutDashboard, accessible: hasAccess('dashboard') },
    { label: 'Disputes', path: '/client/disputes', icon: FileText, accessible: hasAccess('dispute-generator') },
    { label: 'Documents', path: '/client/documents', icon: CreditCard, accessible: hasAccess('credit-upload') },
    { label: 'Payments', path: '/client/payments', icon: Wallet, accessible: true },
    { label: 'SBA Portal', path: '/sba', icon: Shield, accessible: true },
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-muted-foreground"
                  aria-label="Open navigation menu"
                >
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Search</span>
              <kbd className="hidden md:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">⌘K</kbd>
            </Button>
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
