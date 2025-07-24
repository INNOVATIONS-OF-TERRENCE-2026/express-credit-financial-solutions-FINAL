import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  action: string;
  table_name: string;
  record_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export function useAuditLog() {
  const logAction = async (entry: AuditLogEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get client IP and user agent if available
      const ip_address = entry.ip_address;
      const user_agent = entry.user_agent || navigator.userAgent;

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: entry.action,
          table_name: entry.table_name,
          record_id: entry.record_id,
          details: entry.details,
          ip_address: ip_address,
          user_agent: user_agent
        });

      if (error) {
        console.error('Error logging audit entry:', error);
      }
    } catch (error) {
      console.error('Error in audit logging:', error);
    }
  };

  const logFileUpload = async (fileName: string, fileType: string, fileSize: number) => {
    await logAction({
      action: 'FILE_UPLOAD',
      table_name: 'dispute_docs',
      details: {
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize
      }
    });
  };

  const logFileDelete = async (fileId: string, fileName?: string) => {
    await logAction({
      action: 'FILE_DELETE',
      table_name: 'dispute_docs',
      record_id: fileId,
      details: {
        file_name: fileName
      }
    });
  };

  const logProfileUpdate = async (profileId: string, changes: Record<string, any>) => {
    await logAction({
      action: 'PROFILE_UPDATE',
      table_name: 'profiles',
      record_id: profileId,
      details: changes
    });
  };

  const logDisputeLetterGeneration = async (letterId: string, creditorName: string) => {
    await logAction({
      action: 'DISPUTE_LETTER_GENERATED',
      table_name: 'dispute_letters',
      record_id: letterId,
      details: {
        creditor_name: creditorName
      }
    });
  };

  return {
    logAction,
    logFileUpload,
    logFileDelete,
    logProfileUpdate,
    logDisputeLetterGeneration
  };
}