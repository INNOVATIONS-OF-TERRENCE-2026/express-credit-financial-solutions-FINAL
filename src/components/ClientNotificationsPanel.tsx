import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, Clock } from 'lucide-react';

interface ClientNotificationsPanelProps {
  overrideUserId?: string | null;
}

export function ClientNotificationsPanel({ overrideUserId }: ClientNotificationsPanelProps = {}) {
  const { user } = useAuth();
  const effectiveUserId = overrideUserId || user?.id || null;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (effectiveUserId) { fetchNotifications(); subscribeToNotifications(); }
  }, [effectiveUserId]);

  const fetchNotifications = async () => {
    if (!effectiveUserId) return;
    const { data } = await supabase
      .from('client_notifications' as any)
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('channel', 'in_app')
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data || []) as any[]);
    setLoading(false);
  };

  const subscribeToNotifications = () => {
    if (!effectiveUserId) return;
    const channel = supabase.channel('client-notifs-' + effectiveUserId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'client_notifications', filter: `user_id=eq.${effectiveUserId}` }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const markAsRead = async (id: string) => {
    await supabase.from('client_notifications' as any).update({ is_read: true } as any).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await supabase.from('client_notifications' as any).update({ is_read: true } as any).eq('id', n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="flex items-center justify-center p-8"><Clock className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && <Badge variant="destructive" className="text-[10px]">{unreadCount} new</Badge>}
          </CardTitle>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" className="text-xs" onClick={markAllRead}>Mark all read</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${n.is_read ? 'border-border bg-transparent' : 'border-primary/20 bg-primary/5'}`}>
                <div className={`rounded-full p-1 mt-0.5 ${n.is_read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                  <Bell className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <Button size="sm" variant="ghost" className="shrink-0" onClick={() => markAsRead(n.id)}>
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function useUnreadNotificationCount(overrideUserId?: string | null) {
  const { user } = useAuth();
  const effectiveId = overrideUserId || user?.id || null;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!effectiveId) return;
    const fetch = async () => {
      const { count: c } = await supabase
        .from('client_notifications' as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', effectiveId)
        .eq('channel', 'in_app')
        .eq('is_read', false);
      setCount(c || 0);
    };
    fetch();
    const channel = supabase.channel('notif-count-' + effectiveId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_notifications', filter: `user_id=eq.${effectiveId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [effectiveId]);

  return count;
}
