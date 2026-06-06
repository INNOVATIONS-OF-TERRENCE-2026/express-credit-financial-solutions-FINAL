import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, BarChart3, FileText, Gavel, Wallet, ScrollText, Bell, Settings, Vault, Sparkles, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const GROUPS: { label: string; items: { label: string; to: string; icon: any }[] }[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/client/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Credit Center',
    items: [
      { label: 'Results',   to: '/client/results',  icon: BarChart3 },
      { label: 'Reports',   to: '/client/reports',  icon: FileText },
      { label: 'Disputes',  to: '/client/disputes', icon: Gavel },
    ],
  },
  {
    label: 'Vault',
    items: [
      { label: 'Secure Document Vault', to: '/client/documents', icon: Vault },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Account & Billing', to: '/client/payments', icon: Wallet },
      { label: 'Agreements', to: '/client/agreements', icon: ScrollText },
    ],
  },
  {
    label: 'Concierge',
    items: [
      { label: 'AI Assistant', to: '/client/ai-assistant', icon: Sparkles },
      { label: 'Education', to: '/client/education', icon: GraduationCap },
      { label: 'Messages', to: '/client/messages', icon: Bell },
      { label: 'Settings', to: '/client/settings', icon: Settings },
    ],
  },
];

export function ClientPortalSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

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
              <p className="lux-display text-sm text-foreground tracking-tight">Your Portal</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Express Credit</p>
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
                    const active = isActive(n.to);
                    return (
                      <SidebarMenuItem key={n.to}>
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