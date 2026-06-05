import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { useNavigate } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminShell({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle?: string; actions?: ReactNode }) {
  const navigate = useNavigate();
  const { isAdmin, loading } = useRoles();

  useEffect(() => {
    if (!loading && !isAdmin()) navigate('/');
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin()) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-ivory">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/70 bg-background/85 backdrop-blur-xl px-4 md:px-8 h-16 md:h-[72px]">
            <div className="flex items-center gap-4 min-w-0">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden md:block w-px h-6 bg-border" aria-hidden />
              <div className="min-w-0">
                {subtitle && (
                  <p className="lux-eyebrow !text-[10px] truncate">{subtitle}</p>
                )}
                <h1 className="lux-display text-base md:text-lg text-foreground truncate leading-tight">
                  {title}
                </h1>
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </header>
          <main className="flex-1 px-4 py-8 md:px-10 md:py-12 lg:px-14 overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}