import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/hooks/useRoles";
import { AdminWarBoard } from "@/components/AdminWarBoard";
import { ClientProcessingGrid } from "@/components/ClientProcessingGrid";
import { CasePipelineDashboard } from "@/components/CasePipelineDashboard";
import { AdminReviewQueue } from "@/components/AdminReviewQueue";
import { AutonomousControlPanel } from "@/components/AutonomousControlPanel";
import { AdminAIControlPanel } from "@/components/AdminAIControlPanel";
import { CIPExecutionCenter } from "@/components/CIPExecutionCenter";
import { AutomationControlCenter } from "@/components/AutomationControlCenter";
import { AdminBacklogTools } from "@/components/AdminBacklogTools";

const TABS = [
  { id: "war-board", label: "War Board" },
  { id: "processing", label: "Processing Grid" },
  { id: "pipeline", label: "Pipeline" },
  { id: "review-queue", label: "Review Queue" },
  { id: "autonomous", label: "Autonomous Mode" },
  { id: "ai-exec", label: "AI Execution" },
  { id: "cip", label: "CIP Execution" },
  { id: "automation", label: "Automation Center" },
  { id: "backlog", label: "Backlog Tools" },
];

export default function AdminTools() {
  const { isAdmin, loading } = useRoles();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Advanced Tools - Express Credit & Financial Solutions";
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin()) navigate("/");
  }, [isAdmin, loading, navigate]);

  if (loading || !isAdmin()) return null;

  const openClient = (id: string) => navigate(`/admin/clients/${id}`);

  return (
    <AdminShell
      title="Advanced Tools"
      subtitle="Legacy operational modules — kept available but moved out of the main navigation."
    >
      <Tabs defaultValue="war-board" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto justify-start">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="war-board"><AdminWarBoard onOpenClient={openClient} /></TabsContent>
        <TabsContent value="processing"><ClientProcessingGrid /></TabsContent>
        <TabsContent value="pipeline"><CasePipelineDashboard /></TabsContent>
        <TabsContent value="review-queue"><AdminReviewQueue /></TabsContent>
        <TabsContent value="autonomous"><AutonomousControlPanel /></TabsContent>
        <TabsContent value="ai-exec"><AdminAIControlPanel /></TabsContent>
        <TabsContent value="cip"><CIPExecutionCenter /></TabsContent>
        <TabsContent value="automation"><AutomationControlCenter /></TabsContent>
        <TabsContent value="backlog"><AdminBacklogTools /></TabsContent>
      </Tabs>
    </AdminShell>
  );
}
