import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to real-time changes on specified tables and calls onRefresh
 * with a debounce to avoid rapid successive refreshes.
 */
export function useRealtimeRefresh(
  tables: string[],
  onRefresh: () => void,
  debounceMs = 2000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const debouncedRefresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onRefresh, debounceMs);
    };

    const channel = supabase
      .channel('admin-queue-refresh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispute_letters' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flagged_disputes' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_report_uploads' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_documents' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_agreements' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'autonomous_jobs' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_ai_results' }, debouncedRefresh)
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [onRefresh, debounceMs]);
}
