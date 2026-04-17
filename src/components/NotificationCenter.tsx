import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, FileX, UserX, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string | null;
  severity: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

const ICONS: Record<string, any> = {
  failed_upload: FileX,
  unlinked_account: UserX,
  missing_report: AlertTriangle,
  overdue_task: Clock,
  stalled_client: AlertTriangle,
  new_signup: Bell,
};

export function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.is_read).length;

  const load = async () => {
    const { data } = await supabase
      .from('admin_notifications' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    setItems((data as any) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('admin-notif')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const markAllRead = async () => {
    await supabase.from('admin_notifications' as any)
      .update({ is_read: true, read_at: new Date().toISOString() } as any)
      .eq('is_read', false);
    load();
  };

  const handleClick = (n: Notification) => {
    supabase.from('admin_notifications' as any)
      .update({ is_read: true, read_at: new Date().toISOString() } as any)
      .eq('id', n.id)
      .then(() => load());
    if (n.action_url) {
      const section = n.action_url.replace(/^.*section=/, '');
      window.dispatchEvent(new CustomEvent('admin-set-section', { detail: section }));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] bg-primary text-primary-foreground">
              {unread > 99 ? '99+' : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-8">
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              All caught up
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((n) => {
                const Icon = ICONS[n.notification_type] || Bell;
                const sev =
                  n.severity === 'critical' ? 'text-red-500' :
                  n.severity === 'warning' ? 'text-amber-500' : 'text-primary';
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left p-3 hover:bg-accent/30 transition-colors ${
                      !n.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${sev}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-2" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
