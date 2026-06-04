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
import { FloatingChat } from "./components/FloatingChat";
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
import { DisputeCenter } from "./pages/DisputeCenter";
import { DataFreezeCenter } from "./pages/DataFreezeCenter";
import { ClientOnboarding } from "./pages/ClientOnboarding";
import { DocumentUpload } from "./pages/DocumentUpload";
import MembershipPricing from "./pages/MembershipPricing";

import Education from "./pages/Education";
import CreditTracking from "./pages/CreditTracking";
import CreditBuildingCenter from "./pages/CreditBuildingCenter";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ClientPortals from "./pages/ClientPortals";
import ClientPortalLinks from "./pages/ClientPortalLinks";
import { GoodwillLetters } from "./pages/GoodwillLetters";
import { CreditMonitoring } from "./pages/CreditMonitoring";
import { CreditReportUploadPage } from "./pages/CreditReportUploadPage";
import { AICreditAssistantPage } from "./pages/AICreditAssistantPage";
import { DocumentUploadCenter } from "./pages/DocumentUploadCenter";
import AdminClients from "./pages/AdminClients";
import AdminClientEdit from "./pages/AdminClientEdit";
import AdminClientPreview from "./pages/AdminClientPreview";
import AdminSettings from "./pages/AdminSettings";
import AdminTools from "./pages/AdminTools";
import CreditScoreTracker from "./pages/CreditScoreTracker";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentHistoryPage from "./pages/PaymentHistoryPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";

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
                      <FloatingChat />
                      <Routes>
                        {/* SBA Routes */}
                        <Route path="/sba" element={<SBAHome />} />
                        <Route path="/sba/precheck" element={<SBAPreCheck />} />
                        <Route path="/sba/consent" element={<SBAConsent />} />
                        <Route path="/sba/intake" element={<SBAIntake />} />
                        <Route path="/sba/documents" element={<SBADocuments />} />
                        <Route path="/sba/packet" element={<SBAPacket />} />
                        <Route path="/sba/dashboard" element={<SBADashboard />} />
                        <Route path="/sba/admin" element={<SBAAdmin />} />
                        
                        {/* Existing Routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/dispute-center" element={<ProtectedRoute requiredFeature="dispute-generator" featureName="Dispute Center"><DisputeCenter /></ProtectedRoute>} />
                        <Route path="/data-freeze" element={<ProtectedRoute requiredFeature="dispute-generator" featureName="Data Freeze Center"><DataFreezeCenter /></ProtectedRoute>} />
                        <Route path="/onboarding" element={<ClientOnboarding />} />
                        <Route path="/documents" element={<ProtectedRoute requiredFeature="credit-upload" featureName="Document Upload"><DocumentUpload /></ProtectedRoute>} />
                        <Route path="/membership" element={<MembershipPricing />} />
                        <Route path="/education" element={<ProtectedRoute requiredFeature="education" featureName="Education Center"><Education /></ProtectedRoute>} />
                        <Route path="/credit-tracking" element={<ProtectedRoute requiredFeature="dashboard" featureName="Credit Tracking"><CreditTracking /></ProtectedRoute>} />
                        <Route path="/credit-building" element={<ProtectedRoute requiredFeature="credit-building" featureName="Credit Building Center"><CreditBuildingCenter /></ProtectedRoute>} />
                        <Route path="/goodwill-letters" element={<GoodwillLetters />} />
                        <Route path="/credit-monitoring" element={<CreditMonitoring />} />
                        <Route path="/upload-credit-report" element={<ProtectedRoute requiredFeature="credit-upload" featureName="Credit Report Upload"><CreditReportUploadPage /></ProtectedRoute>} />
                        <Route path="/ai-assistant" element={<ProtectedRoute requiredFeature="dashboard" featureName="AI Credit Assistant"><AICreditAssistantPage /></ProtectedRoute>} />
                        <Route path="/document-center" element={<ProtectedRoute requiredFeature="dashboard" featureName="Document Upload Center"><DocumentUploadCenter /></ProtectedRoute>} />
                        <Route path="/score-tracker" element={<ProtectedRoute requiredFeature="dashboard" featureName="Credit Score Tracker"><CreditScoreTracker /></ProtectedRoute>} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={<AdminCommandCenter />} />
                        {/* Legacy admin dashboard — kept mounted under hidden path for rollback */}
                        <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
                        <Route path="/admin-dashboard-legacy" element={<AdminDashboard />} />
                        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                        <Route path="/admin/upload-reports" element={<AdminUploadReports />} />
                        <Route path="/admin/reports" element={<AdminReportsList />} />
                        <Route path="/admin/disputes" element={<AdminDisputesPage />} />
                        <Route path="/admin/documents" element={<AdminDocumentsPage />} />
                        <Route path="/admin/agreements" element={<AdminAgreementsPage />} />
                        <Route path="/admin/activity" element={<AdminActivityPage />} />
                        {/* Legacy client payment routes → canonical client portal */}
                        <Route path="/payments" element={<Navigate to="/client/payments" replace />} />
                        <Route path="/payment-history" element={<Navigate to="/client/payments" replace />} />
                        <Route path="/admin/clients/:clientId" element={<AdminClientEdit />} />
                        <Route path="/admin/client-preview/:clientId" element={<AdminClientPreview />} />
                        <Route path="/admin/clients" element={<AdminClients />} />
                        <Route path="/admin/settings" element={<AdminSettings />} />
                        <Route path="/admin/tools" element={<AdminTools />} />
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
                        <Route path="/client/dashboard"  element={<ClientDashboardPage />} />
                        <Route path="/client/results"    element={<ClientResultsPage />} />
                        <Route path="/client/reports"    element={<ClientReportsPage />} />
                        <Route path="/client/disputes"   element={<ClientDisputesPage />} />
                        <Route path="/client/documents"  element={<ClientDocumentsPage />} />
                        <Route path="/client/payments"   element={<ClientPaymentsPage />} />
                        <Route path="/client/agreements" element={<ClientAgreementsPage />} />
                        <Route path="/client/messages"   element={<ClientMessagesPage />} />
                        <Route path="/client/settings"   element={<ClientSettingsPage />} />
                        <Route path="/client/:clientSlug" element={<ClientPortals />} />
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
