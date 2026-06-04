import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Users, Upload, FileSearch, Gavel, FileText,
  Wallet, ScrollText, Activity, Settings, Wrench, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const GROUPS: { label: string; items: { label: string; to: string; icon: any; exact?: boolean }[] }[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Command Center', to: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Activity',       to: '/admin/activity', icon: Activity },
    ],
  },
  {
    label: 'Clients',
    items: [
      { label: 'All Clients', to: '/admin/clients',    icon: Users },
      { label: 'Agreements',  to: '/admin/agreements', icon: ScrollText },
    ],
  },
  {
    label: 'Credit Operations',
    items: [
      { label: 'Upload Reports',    to: '/admin/upload-reports', icon: Upload },
      { label: 'Reports & Results', to: '/admin/reports',        icon: FileSearch },
      { label: 'Disputes',          to: '/admin/disputes',       icon: Gavel },
      { label: 'Documents',         to: '/admin/documents',      icon: FileText },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', to: '/admin/payments', icon: Wallet },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings',       to: '/admin/settings', icon: Settings },
      { label: 'Advanced Tools', to: '/admin/tools',    icon: Wrench },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const collapsed = state === 'collapsed';

  const isActive = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(path + '/');

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <Crown className="h-4 w-4 text-black" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold tracking-tight">Express Credit</p>
              <p className="text-xs text-muted-foreground">Command Center</p>
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
                      <SidebarMenuButton asChild isActive={isActive(n.to, n.exact)} tooltip={n.label}>
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