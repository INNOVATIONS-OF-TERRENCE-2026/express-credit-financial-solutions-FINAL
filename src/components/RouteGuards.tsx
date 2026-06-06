import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Lock, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { useMembership } from '@/hooks/useMembership';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading secure portal…</p>
      </div>
    </div>
  );
}

function AccessDeniedCard({
  title,
  description,
  icon,
  primaryTo,
  primaryLabel,
  secondaryTo,
  secondaryLabel,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  primaryTo: string;
  primaryLabel: string;
  secondaryTo?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border/70 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link to={primaryTo}>{primaryLabel}</Link>
          </Button>
          {secondaryTo && secondaryLabel && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to={secondaryTo}>{secondaryLabel}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Requires a signed-in Supabase user. Redirects to login otherwise. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenSpinner />;
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

/** Requires a signed-in user with the admin role. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRoles();
  const location = useLocation();

  if (authLoading || roleLoading) return <FullScreenSpinner />;
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin()) {
    return (
      <AccessDeniedCard
        title="Admin Access Required"
        description="This area is restricted to authorized Express Credit administrators."
        icon={<ShieldCheck className="h-6 w-6" aria-hidden="true" />}
        primaryTo="/client/dashboard"
        primaryLabel="Return to Client Portal"
        secondaryTo="/"
        secondaryLabel="Go Home"
      />
    );
  }
  return <>{children}</>;
}

/** Requires paid/service-enabled portal access for a specific feature. */
export function RequireClientAccess({
  children,
  feature = 'dashboard',
  featureName = 'this portal area',
}: {
  children: React.ReactNode;
  feature?: string;
  featureName?: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const { loading: membershipLoading, hasAccess, serviceAccessActive } = useMembership();
  const location = useLocation();

  if (authLoading || membershipLoading) return <FullScreenSpinner />;
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasAccess(feature)) {
    return (
      <AccessDeniedCard
        title={serviceAccessActive ? 'Upgrade Required' : 'Service Access Required'}
        description={
          serviceAccessActive
            ? `Your current access level does not include ${featureName}.`
            : 'Your secure portal is active, but this service area requires an active membership or admin-enabled service access.'
        }
        icon={<Wallet className="h-6 w-6" aria-hidden="true" />}
        primaryTo="/membership"
        primaryLabel="View Membership Options"
        secondaryTo="/client/dashboard"
        secondaryLabel="Back to Dashboard"
      />
    );
  }

  return <>{children}</>;
}

export function LockedRouteNotice({ featureName = 'this feature' }: { featureName?: string }) {
  return (
    <AccessDeniedCard
      title="Access Required"
      description={`Please sign in and activate service access to use ${featureName}.`}
      icon={<Lock className="h-6 w-6" aria-hidden="true" />}
      primaryTo="/membership"
      primaryLabel="View Membership Options"
      secondaryTo="/"
      secondaryLabel="Return Home"
    />
  );
}
