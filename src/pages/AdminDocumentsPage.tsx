import { AdminShell } from '@/components/admin/AdminShell';
import { AdminDocumentList } from '@/components/AdminDocumentList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDocumentsPage() {
  return (
    <AdminShell title="Documents" subtitle="All client documents pending review or archived">
      <Card>
        <CardHeader><CardTitle className="text-base">Document Inbox</CardTitle></CardHeader>
        <CardContent><AdminDocumentList /></CardContent>
      </Card>
    </AdminShell>
  );
}