import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { resolveClientForPortal } from '@/lib/clientResolver';

export interface ResolvedClientContext {
  clientId: string | null;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  loading: boolean;
  portalStatus: 'linked' | 'auto_linked' | 'created' | 'pending_setup' | null;
  pendingReason: string | null;
  refresh: () => Promise<void>;
  raw: any | null;
}

const Ctx = createContext<ResolvedClientContext | undefined>(undefined);

const emptyClientState = (email?: string | null, reason: string = 'pending_setup'): Omit<ResolvedClientContext, 'refresh'> => ({
  clientId: null,
  userId: null,
  fullName: null,
  email: email ?? null,
  loading: false,
  portalStatus: 'pending_setup',
  pendingReason: reason,
  raw: null,
});

export function ClientProvider({ children, overrideClientId }: { children: ReactNode; overrideClientId?: string | null }) {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const [state, setState] = useState<Omit<ResolvedClientContext, 'refresh'>>({
    clientId: null,
    userId: null,
    fullName: null,
    email: null,
    loading: true,
    portalStatus: null,
    pendingReason: null,
    raw: null,
  });

  const load = async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      if (rolesLoading) return;

      if (overrideClientId) {
        const { data } = await supabase.from('clients').select('*').eq('id', overrideClientId).maybeSingle();
        setState({
          clientId: data?.id ?? null,
          userId: data?.user_id ?? user?.id ?? null,
          fullName: data?.full_name ?? null,
          email: data?.email ?? user?.email ?? null,
          loading: false,
          portalStatus: data ? 'linked' : 'pending_setup',
          pendingReason: data ? null : 'no_match',
          raw: data,
        });
        return;
      }

      // Admins are operators, not clients. Never auto-resolve or auto-link an admin session to a client record.
      if (isAdmin()) {
        setState(emptyClientState(user?.email, 'admin_not_client'));
        return;
      }

      const resolution = await resolveClientForPortal(user);
      if (resolution.status === 'pending_setup') {
        setState({
          clientId: null,
          userId: user?.id ?? null,
          fullName: null,
          email: user?.email ?? null,
          loading: false,
          portalStatus: 'pending_setup',
          pendingReason: resolution.reason,
          raw: null,
        });
        return;
      }
      const c = resolution.client;
      setState({
        clientId: c.clientId,
        userId: c.userId ?? user?.id ?? null,
        fullName: c.fullName,
        email: c.email ?? user?.email ?? null,
        loading: false,
        portalStatus: resolution.status,
        pendingReason: null,
        raw: c.raw,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, overrideClientId, rolesLoading]);

  return <Ctx.Provider value={{ ...state, refresh: load }}>{children}</Ctx.Provider>;
}

export function useClient() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useClient must be used within ClientProvider');
  return ctx;
}
