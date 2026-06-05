import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'moderator' | 'user';

interface RolesContextType {
  userRole: UserRole | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isModerator: () => boolean;
  refreshRole: () => Promise<void>;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    setLoading(true);

    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: true }) // admin first, then moderator, then user
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
        setUserRole('user');
        return;
      }

      setUserRole(data?.role as UserRole || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user'); // Default fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user?.id]);

  const hasRole = (role: UserRole): boolean => {
    if (!userRole) return false;
    
    const roleHierarchy = { admin: 3, moderator: 2, user: 1 };
    return roleHierarchy[userRole] >= roleHierarchy[role];
  };

  const isAdmin = (): boolean => userRole === 'admin';
  const isModerator = (): boolean => userRole === 'moderator' || userRole === 'admin';

  const refreshRole = async () => {
    setLoading(true);
    await fetchUserRole();
  };

  const value = {
    userRole,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    refreshRole,
  };

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>;
}

export function useRoles() {
  const context = useContext(RolesContext);
  if (context === undefined) {
    throw new Error('useRoles must be used within a RolesProvider');
  }
  return context;
}