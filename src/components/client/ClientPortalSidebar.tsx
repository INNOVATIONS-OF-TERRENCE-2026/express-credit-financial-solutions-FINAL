import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, BarChart3, FileText, Gavel, Upload, Wallet, ScrollText, Bell, Settings, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const GROUPS: { label: string; items: { label: string; to: string; icon: any }[] }[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/client/dashboard', icon: LayoutDashboard },
      { label: 'Results',   to: '/client/results',   icon: BarChart3 },
    ],
  },
  {
    label: 'Credit Work',
    items: [
      { label: 'Reports',   to: '/client/reports',   icon: FileText },
      { label: 'Disputes',  to: '/client/disputes',  icon: Gavel },
      { label: 'Documents', to: '/client/documents', icon: Upload },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Payments',   to: '/client/payments',   icon: Wallet },
      { label: 'Agreements', to: '/client/agreements', icon: ScrollText },
    ],
  },
  {
    label: 'Communication',
    items: [
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
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold tracking-tight">Your Portal</p>
              <p className="text-xs text-muted-foreground">Express Credit</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((group) => {
          return (
            <SidebarGroup key={group.label}>
              {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((n) => (
                    <SidebarMenuItem key={n.to}>
                      <SidebarMenuButton asChild isActive={isActive(n.to)} tooltip={n.label}>
                        <NavLink to={n.to} className="flex items-center gap-2">
                          <n.icon className="h-4 w-4" />
                          {!collapsed && <span>{n.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
            Sign Out
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}