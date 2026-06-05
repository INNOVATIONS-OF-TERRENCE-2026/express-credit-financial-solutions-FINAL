import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ThemeConfigProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./hooks/useAuth";
import { MembershipProvider } from "./hooks/useMembership";
import { RolesProvider } from "./hooks/useRoles";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireAuth, RequireAdmin } from "./components/RouteGuards";
import { FloatingChat } from "./components/FloatingChat";
import { useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SBAConfigProvider } from "./contexts/SBAConfig";
import { ScrollToTop } from "./components/ScrollToTop";
import { GlobalSearchCommand } from "./components/GlobalSearchCommand";

// SBA Pages
import SBAHome from "./pages/sba/Home";
import SBAPreCheck from "./pages/sba/PreCheck";
import SBAConsent from "./pages/sba/Consent";
import SBAIntake from "./pages/sba/Intake";
import SBADocuments from "./pages/sba/Documents";
import SBAPacket from "./pages/sba/Packet";
import SBADashboard from "./pages/sba/Dashboard";
import SBAAdmin from "./pages/sba/Admin";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ClientOnboarding } from "./pages/ClientOnboarding";
import MembershipPricing from "./pages/MembershipPricing";
import AdminLogin from "./pages/AdminLogin";
import ClientPortals from "./pages/ClientPortals";
import ClientPortalLinks from "./pages/ClientPortalLinks";
import AdminClients from "./pages/AdminClients";
import AdminClientEdit from "./pages/AdminClientEdit";
import AdminClientPreview from "./pages/AdminClientPreview";
import AdminClientRegistry from "./pages/AdminClientRegistry";
import AdminSettings from "./pages/AdminSettings";
import AdminTools from "./pages/AdminTools";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminPaymentSummaryPage from "./pages/AdminPaymentSummaryPage";
import AdminVerificationReport from "./pages/AdminVerificationReport";
import AdminClientPortalEditor from "./pages/AdminClientPortalEditor";

// New unified admin + premium client portal
import AdminCommandCenter from "./pages/AdminCommandCenter";
import AdminUploadReports from "./pages/AdminUploadReports";
import AdminReportsList from "./pages/AdminReportsList";
import AdminDisputesPage from "./pages/AdminDisputesPage";
import AdminDocumentsPage from "./pages/AdminDocumentsPage";
import AdminAgreementsPage from "./pages/AdminAgreementsPage";
import AdminActivityPage from "./pages/AdminActivityPage";
import ClientDashboardPage from "./pages/client/Dashboard";
import ClientResultsPage from "./pages/client/Results";
import ClientReportsPage from "./pages/client/Reports";
import ClientDisputesPage from "./pages/client/Disputes";
import ClientDocumentsPage from "./pages/client/Documents";
import ClientPaymentsPage from "./pages/client/Payments";
import ClientAgreementsPage from "./pages/client/Agreements";
import ClientMessagesPage from "./pages/client/Messages";
import ClientSettingsPage from "./pages/client/Settings";

const queryClient = new QueryClient();

function ScopedFloatingChat() {
  const { pathname } = useLocation();
  // Only render on canonical client portal pages
  if (!pathname.startsWith("/client/")) return null;
  return <FloatingChat />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <ThemeConfigProvider>
          <SBAConfigProvider>
            <AuthProvider>
              <RolesProvider>
                <MembershipProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <ScrollToTop />
                      <GlobalSearchCommand />
                      <ScopedFloatingChat />
                      <Routes>
                        {/* SBA Routes */}
                        <Route path="/sba" element={<SBAHome />} />
                        <Route path="/sba/precheck" element={<SBAPreCheck />} />
                        <Route path="/sba/consent" element={<SBAConsent />} />
                        <Route path="/sba/intake" element={<SBAIntake />} />
                        <Route path="/sba/documents" element={<SBADocuments />} />
                        <Route path="/sba/packet" element={<SBAPacket />} />
                        <Route path="/sba/dashboard" element={<SBADashboard />} />
                        <Route path="/sba/admin" element={<RequireAdmin><SBAAdmin /></RequireAdmin>} />
                        
                        {/* Existing Routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/onboarding" element={<ClientOnboarding />} />
                        <Route path="/membership" element={<MembershipPricing />} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={<RequireAdmin><AdminCommandCenter /></RequireAdmin>} />
                        <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
                        <Route path="/admin/payments" element={<RequireAdmin><AdminPaymentsPage /></RequireAdmin>} />
                        <Route path="/admin/payment-summary" element={<RequireAdmin><AdminPaymentSummaryPage /></RequireAdmin>} />
                        <Route path="/admin/verification-report" element={<RequireAdmin><AdminVerificationReport /></RequireAdmin>} />
                        <Route path="/admin/client-portal-editor/:clientId" element={<RequireAdmin><AdminClientPortalEditor /></RequireAdmin>} />
                        <Route path="/admin/upload-reports" element={<RequireAdmin><AdminUploadReports /></RequireAdmin>} />
                        <Route path="/admin/reports" element={<RequireAdmin><AdminReportsList /></RequireAdmin>} />
                        <Route path="/admin/disputes" element={<RequireAdmin><AdminDisputesPage /></RequireAdmin>} />
                        <Route path="/admin/documents" element={<RequireAdmin><AdminDocumentsPage /></RequireAdmin>} />
                        <Route path="/admin/agreements" element={<RequireAdmin><AdminAgreementsPage /></RequireAdmin>} />
                        <Route path="/admin/activity" element={<RequireAdmin><AdminActivityPage /></RequireAdmin>} />
                        {/* Legacy client payment routes → canonical client portal */}
                        <Route path="/payments" element={<Navigate to="/client/payments" replace />} />
                        <Route path="/payment-history" element={<Navigate to="/client/payments" replace />} />
                        <Route path="/admin/clients/:clientId" element={<RequireAdmin><AdminClientEdit /></RequireAdmin>} />
                        <Route path="/admin/client-preview/:clientId" element={<RequireAdmin><AdminClientPreview /></RequireAdmin>} />
                        <Route path="/admin/clients" element={<RequireAdmin><AdminClients /></RequireAdmin>} />
                        <Route path="/admin/client-registry" element={<RequireAdmin><AdminClientRegistry /></RequireAdmin>} />
                        <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
                        <Route path="/admin/tools" element={<RequireAdmin><AdminTools /></RequireAdmin>} />
                        <Route path="/client-portals" element={<ClientPortalLinks />} />
                        {/* Legacy client-facing routes → canonical client portal */}
                        <Route path="/upload-credit-report" element={<Navigate to="/client/documents" replace />} />
                        <Route path="/document-center" element={<Navigate to="/client/documents" replace />} />
                        <Route path="/documents" element={<Navigate to="/client/documents" replace />} />
                        <Route path="/dispute-center" element={<Navigate to="/client/disputes" replace />} />
                        <Route path="/data-freeze" element={<Navigate to="/client/disputes" replace />} />
                        <Route path="/credit-tracking" element={<Navigate to="/client/results" replace />} />
                        <Route path="/credit-monitoring" element={<Navigate to="/client/results" replace />} />
                        <Route path="/score-tracker" element={<Navigate to="/client/results" replace />} />
                        <Route path="/credit-building" element={<Navigate to="/client/dashboard" replace />} />
                        <Route path="/goodwill-letters" element={<Navigate to="/client/disputes" replace />} />
                        <Route path="/education" element={<Navigate to="/client/dashboard" replace />} />
                        <Route path="/ai-assistant" element={<Navigate to="/client/dashboard" replace />} />
                        {/* Legacy SBA duplicate prefix → canonical /sba */}
                        <Route path="/sba-portal" element={<Navigate to="/sba" replace />} />
                        <Route path="/sba-portal/precheck" element={<Navigate to="/sba/precheck" replace />} />
                        <Route path="/sba-portal/consent" element={<Navigate to="/sba/consent" replace />} />
                        <Route path="/sba-portal/intake" element={<Navigate to="/sba/intake" replace />} />
                        <Route path="/sba-portal/documents" element={<Navigate to="/sba/documents" replace />} />
                        <Route path="/sba-portal/packet" element={<Navigate to="/sba/packet" replace />} />
                        <Route path="/sba-portal/dashboard" element={<Navigate to="/sba/dashboard" replace />} />
                        <Route path="/sba-portal/admin" element={<Navigate to="/sba/admin" replace />} />
                        {/* Canonical premium client portal */}
                        <Route path="/client/dashboard"  element={<RequireAuth><ClientDashboardPage /></RequireAuth>} />
                        <Route path="/client/results"    element={<RequireAuth><ClientResultsPage /></RequireAuth>} />
                        <Route path="/client/reports"    element={<RequireAuth><ClientReportsPage /></RequireAuth>} />
                        <Route path="/client/disputes"   element={<RequireAuth><ClientDisputesPage /></RequireAuth>} />
                        <Route path="/client/documents"  element={<RequireAuth><ClientDocumentsPage /></RequireAuth>} />
                        <Route path="/client/payments"   element={<RequireAuth><ClientPaymentsPage /></RequireAuth>} />
                        <Route path="/client/agreements" element={<RequireAuth><ClientAgreementsPage /></RequireAuth>} />
                        <Route path="/client/messages"   element={<RequireAuth><ClientMessagesPage /></RequireAuth>} />
                        <Route path="/client/settings"   element={<RequireAuth><ClientSettingsPage /></RequireAuth>} />
                        {/* Legacy slug-based portal → canonical premium portal */}
                        <Route path="/client/:clientSlug" element={<Navigate to="/client/dashboard" replace />} />
                        {/* Admin-only legacy preview kept for rollback */}
                        <Route path="/client-portals-legacy/:clientSlug" element={<ClientPortals />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
                </MembershipProvider>
              </RolesProvider>
            </AuthProvider>
          </SBAConfigProvider>
        </ThemeConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
