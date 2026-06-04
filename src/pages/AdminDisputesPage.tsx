import { AdminShell } from '@/components/admin/AdminShell';
import { AdminReviewQueue } from '@/components/AdminReviewQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaggedDisputesTable } from '@/components/FlaggedDisputesTable';
import { BulkDisputeWizard } from '@/components/BulkDisputeWizard';

export default function AdminDisputesPage() {
  return (
    <AdminShell title="Disputes" subtitle="Review queue, flagged disputes, and letter management">
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Disputes</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Wizard</TabsTrigger>
        </TabsList>
        <TabsContent value="queue">
          <Card>
            <CardHeader><CardTitle className="text-base">Dispute Review Queue</CardTitle></CardHeader>
            <CardContent><AdminReviewQueue /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="flagged">
          <Card>
            <CardHeader><CardTitle className="text-base">Flagged Disputes</CardTitle></CardHeader>
            <CardContent><FlaggedDisputesTable /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bulk">
          <Card>
            <CardHeader><CardTitle className="text-base">Bulk Dispute Wizard</CardTitle></CardHeader>
            <CardContent><BulkDisputeWizard /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}