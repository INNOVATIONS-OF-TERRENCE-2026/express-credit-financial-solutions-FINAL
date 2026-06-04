import { AdminShell } from '@/components/admin/AdminShell';
import { AdminReviewQueue } from '@/components/AdminReviewQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDisputesPage() {
  return (
    <AdminShell title="Disputes" subtitle="Review queue, flagged disputes, and letter management">
      <Card>
        <CardHeader><CardTitle className="text-base">Dispute Review Queue</CardTitle></CardHeader>
        <CardContent><AdminReviewQueue /></CardContent>
      </Card>
    </AdminShell>
  );
}