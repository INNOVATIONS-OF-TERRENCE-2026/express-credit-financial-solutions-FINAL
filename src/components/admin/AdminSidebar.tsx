import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Users, Upload, FileSearch, Gavel, FileText,
  Wallet, ScrollText, Activity, Settings, Wrench, ShieldCheck, ClipboardCheck,
  TrendingUp, BarChart3, Home, ListChecks, RefreshCcw, Receipt, UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const GROUPS: { label: string; items: { label: string; to: string; icon: any; exact?: boolean }[] }[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Command Center', to: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Clients',
    items: [
      { label: 'Directory',     to: '/admin/clients',           icon: Users },
      { label: 'Portal Editor', to: '/admin/client-registry',   icon: UserCog },
      { label: 'Reports',       to: '/admin/reports',           icon: FileSearch },
      { label: 'Documents',     to: '/admin/documents',         icon: FileText },
      { label: 'Payments',      to: '/admin/payments',          icon: Wallet },
      { label: 'Agreements',    to: '/admin/agreements',        icon: ScrollText },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Disputes',   to: '/admin/disputes',                icon: Gavel },
      { label: 'Work Queue', to: '/admin/disputes?status=review',  icon: ListChecks },
      { label: 'Processing', to: '/admin/upload-reports',          icon: Upload },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Revenue',            to: '/admin/payment-summary', icon: Receipt },
      { label: 'Deletions',          to: '/admin/reports?focus=deletions', icon: TrendingUp },
      { label: 'Score Growth',       to: '/admin/reports?focus=growth',    icon: BarChart3 },
      { label: 'Mortgage Readiness', to: '/admin/clients?focus=readiness', icon: Home },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Reconciliation', to: '/admin/tools',                icon: RefreshCcw },
      { label: 'Registry',       to: '/admin/client-registry',      icon: ShieldCheck },
      { label: 'Audit Reports',  to: '/admin/activity',             icon: Activity },
      { label: 'Verification',   to: '/admin/verification-report',  icon: ClipboardCheck },
      { label: 'Advanced Tools', to: '/admin/tools',                icon: Wrench },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const collapsed = state === 'collapsed';

  const isActive = (path: string, exact?: boolean) => {
    const base = path.split('?')[0];
    return exact
      ? pathname === base
      : pathname === base || pathname.startsWith(base + '/');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border/70">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md bg-gradient-midnight text-ivory shadow-card"
          >
            <span className="lux-display text-base leading-none">E</span>
            <span className="absolute inset-x-1 bottom-1 h-px bg-gradient-to-r from-transparent via-gold-soft to-transparent" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="lux-display text-sm text-foreground tracking-tight">Express Credit</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Private Office</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-1 py-3">
        {GROUPS.map((group) => {
          return (
            <SidebarGroup key={group.label}>
              {!collapsed && (
                <SidebarGroupLabel className="!text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 px-3 mt-2">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((n) => {
                    const active = isActive(n.to, n.exact);
                    return (
                      <SidebarMenuItem key={n.to + n.label}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={n.label}
                          className={cn(
                            'relative rounded-lg h-10 my-0.5 transition-colors',
                            active && 'bg-sidebar-accent text-foreground font-medium',
                          )}
                        >
                          <NavLink to={n.to} className="flex items-center gap-3 pl-3">
                            {active && (
                              <span
                                aria-hidden
                                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-gold"
                              />
                            )}
                            <n.icon className={cn('h-4 w-4 shrink-0', active && 'text-gold-deep')} />
                            {!collapsed && <span className="truncate">{n.label}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border/70">
        {!collapsed && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-border/80 hover:bg-secondary"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}