import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, FileText, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadFile, formatFileSize, previewFile } from '@/lib/documentUtils';
import {
  AdminDoc,
  AdminDocSource,
  useAdminClientDocuments,
} from '@/hooks/useAdminClientDocuments';

type SourceFilter = AdminDocSource | 'all';

const sourceVariant = (s: AdminDocSource): 'default' | 'secondary' | 'outline' => {
  switch (s) {
    case 'verification':
      return 'default';
    case 'credit_report':
      return 'secondary';
    default:
      return 'outline';
  }
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

export function AdminDocumentList() {
  const { docs, loading, error, refresh } = useAdminClientDocuments();
  const { toast } = useToast();
  const [actionId, setActionId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (sourceFilter !== 'all' && d.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        d.clientName.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        d.docType.toLowerCase().includes(q)
      );
    });
  }, [docs, sourceFilter, query]);

  const handleView = async (doc: AdminDoc) => {
    if (!doc.filePath) {
      toast({ title: 'No file path', description: 'This record has no stored file.', variant: 'destructive' });
      return;
    }
    setActionId(`v-${doc.id}`);
    try {
      await previewFile(doc.bucket, doc.filePath);
    } catch {
      toast({ title: 'Preview failed', description: 'Could not generate preview URL', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  };

  const handleDownload = async (doc: AdminDoc) => {
    if (!doc.filePath) {
      toast({ title: 'No file path', description: 'This record has no stored file.', variant: 'destructive' });
      return;
    }
    setActionId(`d-${doc.id}`);
    try {
      await downloadFile(doc.bucket, doc.filePath, doc.fileName);
    } catch {
      toast({ title: 'Download failed', description: 'Could not download file', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Client Documents
          </CardTitle>
          <CardDescription>
            Verification, credit reports, general uploads, and archive — all sources, newest first.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="Search client, file name, or type…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:max-w-sm"
          />
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
            <SelectTrigger className="md:w-[200px]">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="verification">Verification</SelectItem>
              <SelectItem value="credit_report">Credit Reports</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="archive">Archive</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground md:ml-auto">
            {loading ? 'Loading…' : `${filtered.length} of ${docs.length} documents`}
          </div>
        </div>

        {error ? (
          <p className="text-center text-destructive py-8 text-sm">{error}</p>
        ) : loading ? (
          <p className="text-center text-muted-foreground py-8">Loading documents...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {docs.length === 0 ? 'No documents uploaded yet.' : 'No documents match your filters.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium max-w-[180px] truncate" title={doc.clientName}>
                      {doc.clientName}
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate" title={doc.fileName}>
                      {doc.fileName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sourceVariant(doc.source)}>{doc.sourceLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{doc.docType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.sizeBytes != null ? formatFileSize(doc.sizeBytes) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(doc.uploadedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(doc)}
                          disabled={actionId === `v-${doc.id}` || !doc.filePath}
                          aria-label={`View ${doc.fileName}`}
                        >
                          {actionId === `v-${doc.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          disabled={actionId === `d-${doc.id}` || !doc.filePath}
                          aria-label={`Download ${doc.fileName}`}
                        >
                          {actionId === `d-${doc.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
