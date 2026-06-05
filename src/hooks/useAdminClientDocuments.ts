import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AdminDocSource =
  | 'verification'
  | 'credit_report'
  | 'general'
  | 'archive';

export interface AdminDoc {
  id: string;
  source: AdminDocSource;
  sourceLabel: string;
  userId: string | null;
  clientId: string | null;
  clientName: string;
  fileName: string;
  filePath: string;
  bucket: string;
  docType: string;
  sizeBytes: number | null;
  status: string;
  uploadedAt: string;
}

const SOURCE_LABEL: Record<AdminDocSource, string> = {
  verification: 'Verification',
  credit_report: 'Credit Report',
  general: 'General',
  archive: 'Archive',
};

const safeFileName = (path: string | null | undefined, fallback = 'document') =>
  (path?.split('/').pop() || fallback).split('?')[0];

export function useAdminClientDocuments() {
  const [docs, setDocs] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client: any = supabase;
      const [
        creditReports,
        generalUploads,
        archive,
        verification,
        clientsList,
      ] = await Promise.all([
        client
          .from('credit_report_uploads')
          .select('id,user_id,client_id,file_name,file_path,file_type,file_size,analysis_status,uploaded_at')
          .order('uploaded_at', { ascending: false })
          .limit(500),
        client
          .from('documents')
          .select('id,user_id,client_id,file_name,file_path,uploaded_file_url,file_type,file_size,document_type,doc_type,upload_date,created_at')
          .order('upload_date', { ascending: false })
          .limit(500),
        client
          .from('document_archive')
          .select('id,user_id,file_name,file_path,file_type,document_type,file_size,upload_date')
          .order('upload_date', { ascending: false })
          .limit(500),
        client
          .from('client_verification_secure')
          .select('id,user_id,id_document_url,ssn_document_url,address_document_url,updated_at,created_at')
          .order('updated_at', { ascending: false })
          .limit(500),
        client
          .from('clients')
          .select('id,user_id,full_name,email')
          .limit(2000),
      ]);

      const firstError =
        creditReports.error || generalUploads.error || archive.error || verification.error;
      if (firstError) throw firstError;

      const byUser = new Map<string, { id: string; name: string }>();
      for (const c of (clientsList.data as any[]) || []) {
        if (c.user_id) byUser.set(c.user_id, { id: c.id, name: c.full_name || c.email || '—' });
      }
      const lookup = (userId: string | null | undefined) => {
        if (!userId) return { clientId: null, clientName: '—' };
        const m = byUser.get(userId);
        return { clientId: m?.id ?? null, clientName: m?.name ?? '—' };
      };

      const out: AdminDoc[] = [];

      for (const r of (creditReports.data as any[]) || []) {
        const { clientId, clientName } = lookup(r.user_id);
        out.push({
          id: `cr-${r.id}`,
          source: 'credit_report',
          sourceLabel: SOURCE_LABEL.credit_report,
          userId: r.user_id ?? null,
          clientId: r.client_id ?? clientId,
          clientName,
          fileName: r.file_name || safeFileName(r.file_path),
          filePath: r.file_path,
          bucket: 'document-uploads',
          docType: (r.file_type?.split('/')[1] || 'credit report').toLowerCase(),
          sizeBytes: typeof r.file_size === 'number' ? r.file_size : null,
          status: r.analysis_status || 'pending',
          uploadedAt: r.uploaded_at,
        });
      }

      for (const r of (generalUploads.data as any[]) || []) {
        const { clientId, clientName } = lookup(r.user_id);
        out.push({
          id: `gu-${r.id}`,
          source: 'general',
          sourceLabel: SOURCE_LABEL.general,
          userId: r.user_id ?? null,
          clientId: r.client_id ?? clientId,
          clientName,
          fileName: r.file_name || safeFileName(r.file_path || r.uploaded_file_url),
          filePath: r.file_path || r.uploaded_file_url,
          bucket: 'documents',
          docType: (r.document_type || r.doc_type || r.file_type?.split('/')[1] || 'document').toLowerCase(),
          sizeBytes: typeof r.file_size === 'number' ? r.file_size : null,
          status: 'uploaded',
          uploadedAt: r.upload_date || r.created_at,
        });
      }

      for (const r of (archive.data as any[]) || []) {
        const { clientId, clientName } = lookup(r.user_id);
        out.push({
          id: `ar-${r.id}`,
          source: 'archive',
          sourceLabel: SOURCE_LABEL.archive,
          userId: r.user_id ?? null,
          clientId,
          clientName,
          fileName: r.file_name || safeFileName(r.file_path),
          filePath: r.file_path,
          bucket: 'document-archive',
          docType: (r.document_type || r.file_type?.split('/')[1] || 'archive').toLowerCase(),
          sizeBytes: typeof r.file_size === 'number' ? r.file_size : null,
          status: 'archived',
          uploadedAt: r.upload_date,
        });
      }

      for (const r of (verification.data as any[]) || []) {
        const { clientId, clientName } = lookup(r.user_id);
        const ts = r.updated_at || r.created_at;
        const cols: Array<[string, string | null]> = [
          ['id', r.id_document_url],
          ['ssn', r.ssn_document_url],
          ['address', r.address_document_url],
        ];
        for (const [kind, path] of cols) {
          if (!path) continue;
          out.push({
            id: `vs-${r.id}-${kind}`,
            source: 'verification',
            sourceLabel: SOURCE_LABEL.verification,
            userId: r.user_id ?? null,
            clientId,
            clientName,
            fileName: safeFileName(path, `${kind}-document`),
            filePath: path,
            bucket: 'verification-docs',
            docType: kind,
            sizeBytes: null,
            status: 'uploaded',
            uploadedAt: ts,
          });
        }
      }

      out.sort((a, b) => {
        const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return tb - ta;
      });

      setDocs(out);
    } catch (e: any) {
      console.error('useAdminClientDocuments failed:', e);
      setError(e?.message || 'Failed to load documents');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { docs, loading, error, refresh: load };
}