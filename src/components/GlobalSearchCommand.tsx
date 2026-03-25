import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator
} from '@/components/ui/command';
import {
  Home, FileText, CreditCard, GraduationCap, Shield, Snowflake,
  TrendingUp, Sparkles, Settings, LayoutDashboard, ClipboardCheck,
  GitBranch, Brain, Cpu, Zap, Users, Crown, Upload, Mail, FileSearch,
  Search, ExternalLink, BookOpen, Activity, Heart
} from 'lucide-react';

interface SearchEntry {
  label: string;
  keywords: string;
  icon: any;
  category: string;
  action: () => void;
  adminOnly?: boolean;
}

export function GlobalSearchCommand() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useRoles();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Listen for custom event to open from other components
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-command-palette', handler);
    return () => window.removeEventListener('open-command-palette', handler);
  }, []);

  const go = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  const goAdmin = useCallback((section: string) => {
    setOpen(false);
    if (location.pathname === '/admin' || location.pathname === '/admin-dashboard') {
      window.dispatchEvent(new CustomEvent('admin-set-section', { detail: section }));
    } else {
      navigate(`/admin?section=${section}`);
    }
  }, [navigate, location.pathname]);

  const admin = isAdmin();

  const pages: SearchEntry[] = [
    { label: 'Home / Dashboard', keywords: 'home dashboard main landing', icon: Home, category: 'Pages', action: () => go('/') },
    { label: 'Dispute Center', keywords: 'dispute letters generate credit bureau', icon: FileText, category: 'Pages', action: () => go('/dispute-center') },
    { label: 'Data Freeze Center', keywords: 'freeze lock security bureau equifax experian transunion', icon: Snowflake, category: 'Pages', action: () => go('/data-freeze') },
    { label: 'Documents', keywords: 'upload files id proof address documents', icon: CreditCard, category: 'Pages', action: () => go('/documents') },
    { label: 'Credit Report Upload', keywords: 'upload credit report file pdf', icon: FileText, category: 'Pages', action: () => go('/upload-credit-report') },
    { label: 'Education Center', keywords: 'learn education credit score tips', icon: GraduationCap, category: 'Pages', action: () => go('/education') },
    { label: 'Credit Building', keywords: 'build credit tradeline secured card', icon: TrendingUp, category: 'Pages', action: () => go('/credit-building') },
    { label: 'Credit Monitoring', keywords: 'monitor score tracking alerts', icon: TrendingUp, category: 'Pages', action: () => go('/credit-monitoring') },
    { label: 'AI Credit Assistant', keywords: 'ai assistant chat help gpt', icon: Sparkles, category: 'Pages', action: () => go('/ai-assistant') },
    { label: 'Score Tracker', keywords: 'score tracker chart history graph', icon: Activity, category: 'Pages', action: () => go('/score-tracker') },
    { label: 'Membership', keywords: 'membership plan pricing upgrade', icon: Crown, category: 'Pages', action: () => go('/membership') },
    { label: 'Goodwill Letters', keywords: 'goodwill letter forgiveness creditor', icon: Heart, category: 'Pages', action: () => go('/goodwill-letters') },
    { label: 'Document Center', keywords: 'document center uploads manage files', icon: Upload, category: 'Pages', action: () => go('/document-center') },
    { label: 'SBA Portal', keywords: 'sba small business loan portal', icon: Shield, category: 'Pages', action: () => go('/sba-portal') },
    { label: 'Client Onboarding', keywords: 'onboarding setup profile intake', icon: Users, category: 'Pages', action: () => go('/onboarding') },
  ];

  const adminRoutes: SearchEntry[] = [
    { label: 'Admin Dashboard', keywords: 'admin dashboard control panel', icon: LayoutDashboard, category: 'Admin', action: () => go('/admin'), adminOnly: true },
    { label: 'Admin Clients', keywords: 'admin clients manage users list', icon: Users, category: 'Admin', action: () => go('/admin/clients'), adminOnly: true },
    { label: 'Admin Settings', keywords: 'admin settings configuration', icon: Settings, category: 'Admin', action: () => go('/admin/settings'), adminOnly: true },
    { label: 'Admin Tools', keywords: 'admin tools utilities', icon: Settings, category: 'Admin', action: () => go('/admin/tools'), adminOnly: true },
    { label: 'Client Portal Management', keywords: 'client portal links directory manage services', icon: ExternalLink, category: 'Admin', action: () => go('/client-portals'), adminOnly: true },
  ];

  const adminSections: SearchEntry[] = [
    { label: 'Overview Dashboard', keywords: 'overview stats summary metrics', icon: LayoutDashboard, category: 'Admin Sections', action: () => goAdmin('overview'), adminOnly: true },
    { label: 'Backlog Tools', keywords: 'backlog priority queue processing clients', icon: Zap, category: 'Admin Sections', action: () => goAdmin('backlog'), adminOnly: true },
    { label: 'Client Processing Grid', keywords: 'processing grid bulk clients table actions', icon: Users, category: 'Admin Sections', action: () => goAdmin('processing'), adminOnly: true },
    { label: 'Review Queue', keywords: 'review approve reject dispute letters queue', icon: ClipboardCheck, category: 'Admin Sections', action: () => goAdmin('review-queue'), adminOnly: true },
    { label: 'Pipeline', keywords: 'pipeline case workflow status progression', icon: GitBranch, category: 'Admin Sections', action: () => goAdmin('pipeline'), adminOnly: true },
    { label: 'AI Analysis', keywords: 'ai analysis credit report violations flagged', icon: Brain, category: 'Admin Sections', action: () => goAdmin('ai-analysis'), adminOnly: true },
    { label: 'AI Ops Center', keywords: 'ai ops operations generate disputes analyze', icon: Cpu, category: 'Admin Sections', action: () => goAdmin('ai-ops'), adminOnly: true },
    { label: 'Client Management', keywords: 'clients users profiles manage', icon: Users, category: 'Admin Sections', action: () => goAdmin('users'), adminOnly: true },
    { label: 'Membership Management', keywords: 'membership plans assign tier', icon: Crown, category: 'Admin Sections', action: () => goAdmin('membership'), adminOnly: true },
    { label: 'Dispute Management', keywords: 'disputes letters manage status', icon: FileText, category: 'Admin Sections', action: () => goAdmin('disputes'), adminOnly: true },
    { label: 'Document Management', keywords: 'documents uploads files review', icon: Upload, category: 'Admin Sections', action: () => goAdmin('documents'), adminOnly: true },
    { label: 'Credit Reports', keywords: 'credit reports uploads analysis', icon: FileSearch, category: 'Admin Sections', action: () => goAdmin('credit-reports'), adminOnly: true },
    { label: 'Email Notifications', keywords: 'email send notification log', icon: Mail, category: 'Admin Sections', action: () => goAdmin('email'), adminOnly: true },
    { label: 'System Settings', keywords: 'system settings configuration admin', icon: Settings, category: 'Admin Sections', action: () => goAdmin('system'), adminOnly: true },
    { label: 'Bulk Document Intelligence', keywords: 'bulk upload documents ai classify match batch intelligence', icon: Upload, category: 'Admin Sections', action: () => goAdmin('bulk-docs'), adminOnly: true },
  ];

  const allEntries = [
    ...pages,
    ...(admin ? adminRoutes : []),
    ...(admin ? adminSections : []),
  ];

  if (!user) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search everything... ⌘K" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {pages.map(entry => {
            const Icon = entry.icon;
            return (
              <CommandItem key={entry.label} onSelect={entry.action} keywords={[entry.keywords]}>
                <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{entry.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {admin && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin">
              {adminRoutes.map(entry => {
                const Icon = entry.icon;
                return (
                  <CommandItem key={entry.label} onSelect={entry.action} keywords={[entry.keywords]}>
                    <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{entry.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />
            <CommandGroup heading="Admin Dashboard Sections">
              {adminSections.map(entry => {
                const Icon = entry.icon;
                return (
                  <CommandItem key={entry.label} onSelect={entry.action} keywords={[entry.keywords]}>
                    <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{entry.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
