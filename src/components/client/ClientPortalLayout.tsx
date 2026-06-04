import { ReactNode, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ClientPortalSidebar } from './ClientPortalSidebar';
import { ClientProvider, useClient } from '@/contexts/ClientContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

function Inner({ children, title }: { children: ReactNode; title: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { fullName, email, loading: clientLoading } = useClient();

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  if (loading || clientLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/50 bg-background/80 backdrop-blur px-4 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">{title}</h1>
            <p className="text-xs text-muted-foreground truncate">{fullName || email || 'Welcome'}</p>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
    </div>
  );
}

export function ClientPortalLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <ClientProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-background/95">
          <ClientPortalSidebar />
          <Inner title={title}>{children}</Inner>
        </div>
      </SidebarProvider>
    </ClientProvider>
  );
}