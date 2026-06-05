import { ReactNode, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ClientPortalSidebar } from './ClientPortalSidebar';
import { ClientProvider, useClient } from '@/contexts/ClientContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientStatusStrip } from './ClientStatusStrip';

function Inner({ children, title }: { children: ReactNode; title: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { fullName, email, loading: clientLoading, clientId, portalStatus } = useClient();

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

  if (!clientId && portalStatus === 'pending_setup') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3 rounded-xl border border-border bg-card p-8">
          <h1 className="text-lg font-semibold">Portal setup is pending</h1>
          <p className="text-sm text-muted-foreground">
            Your account isn't fully linked yet. Please contact support so we can finish setting up your portal access.
          </p>
          <p className="text-xs text-muted-foreground">
            Signed in as <span className="font-mono">{email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/70 bg-background/85 backdrop-blur-xl px-4 md:px-8 h-16 md:h-[72px]">
        <div className="flex items-center gap-4 min-w-0">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="hidden md:block w-px h-6 bg-border" aria-hidden />
          <div className="min-w-0">
            <p className="lux-eyebrow !text-[10px] truncate">
              Welcome back, {(fullName || email || 'Guest').split(' ')[0]}
            </p>
            <h1 className="lux-display text-base md:text-lg text-foreground truncate leading-tight">
              {title}
            </h1>
          </div>
        </div>
      </header>
      <ClientStatusStrip />
      <main className="flex-1 px-4 py-8 md:px-10 md:py-12 lg:px-14 overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1320px]">{children}</div>
      </main>
    </div>
  );
}

export function ClientPortalLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <ClientProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-ivory">
          <ClientPortalSidebar />
          <Inner title={title}>{children}</Inner>
        </div>
      </SidebarProvider>
    </ClientProvider>
  );
}