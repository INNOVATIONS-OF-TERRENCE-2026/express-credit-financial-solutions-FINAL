import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; user?: User | null; session?: Session | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async (userId = user?.id): Promise<boolean> => {
    try {
      if (!userId) {
        setIsAdmin(false);
        return false;
      }

      // Check user role from database instead of hardcoded emails
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      const adminStatus = !error && data !== null;
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) setIsAdmin(false);
      setLoading(false);
    };

    // Set up auth state listener first, then hydrate once from storage.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        applySession(session);
        
        // Send notification for new user signups (fire-and-forget — never block auth state)
        if (event === 'SIGNED_UP' as AuthChangeEvent && session?.user) {
          supabase.functions.invoke('new-user-notification', {
            body: {
              userEmail: session.user.email,
              userName: session.user.user_metadata?.full_name || session.user.email,
              userId: session.user.id,
              notificationType: 'user_signup'
            }
          }).catch((error) => console.error('Failed to send new user notification:', error));
        }

        console.info('[auth] state change:', event, 'hasSession:', !!session);
        
        const shouldCheckRole = event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED';

        // Check admin status only when identity changes, not on token refresh ticks.
        if (session?.user && shouldCheckRole) {
          window.setTimeout(() => {
            if (mounted) void checkAdminStatus(session.user.id);
          }, 0); // Defer to avoid auth state conflicts
        }
      }
    );

    supabase.auth.getSession()
      .then(({ data }) => applySession(data.session))
      .catch((error) => {
        console.error('[auth] initial session restore failed:', error);
        applySession(null);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }
    return { error, user: data.user, session: data.session };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          email_confirm: true,
          ...metadata,
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    checkAdminStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}