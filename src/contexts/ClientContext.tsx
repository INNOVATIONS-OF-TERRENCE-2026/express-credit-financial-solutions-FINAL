import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ResolvedClientContext {
  clientId: string | null;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  raw: any | null;
}

const Ctx = createContext<ResolvedClientContext | undefined>(undefined);

export function ClientProvider({ children, overrideClientId }: { children: ReactNode; overrideClientId?: string | null }) {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<ResolvedClientContext, 'refresh'>>({
    clientId: null,
    userId: null,
    fullName: null,
    email: null,
    loading: true,
    raw: null,
  });

  const load = async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      let row: any = null;
      if (overrideClientId) {
        const { data } = await supabase.from('clients').select('*').eq('id', overrideClientId).maybeSingle();
        row = data;
      } else if (user) {
        const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).maybeSingle();
        row = data;
      }
      setState({
        clientId: row?.id ?? null,
        userId: row?.user_id ?? user?.id ?? null,
        fullName: row?.full_name ?? null,
        email: row?.email ?? user?.email ?? null,
        loading: false,
        raw: row,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, overrideClientId]);

  return <Ctx.Provider value={{ ...state, refresh: load }}>{children}</Ctx.Provider>;
}

export function useClient() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useClient must be used within ClientProvider');
  return ctx;
}