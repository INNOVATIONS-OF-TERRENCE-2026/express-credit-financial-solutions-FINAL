import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { MembershipProvider } from "./hooks/useMembership";
import { RolesProvider } from "./hooks/useRoles";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { FloatingChat } from "./components/FloatingChat";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SBAConfigProvider } from "./contexts/SBAConfig";
import { ScrollToTop } from "./components/ScrollToTop";

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
import AdminSettings from "./pages/AdminSettings";
import AdminTools from "./pages/AdminTools";
import CreditScoreTracker from "./pages/CreditScoreTracker";
import CashAppCheckout from "./pages/CashAppCheckout";
import AdminCashApp from "./pages/AdminCashApp";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SBAConfigProvider>
        <AuthProvider>
          <RolesProvider>
            <MembershipProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <FloatingChat />
              <BrowserRouter>
                <ScrollToTop />
              <Routes>
                {/* SBA Routes */}
                <Route path="/sba" element={<SBAHome />} />
                <Route path="/sba-portal" element={<SBAHome />} />
                <Route path="/sba/precheck" element={<SBAPreCheck />} />
                <Route path="/sba-portal/precheck" element={<SBAPreCheck />} />
                <Route path="/sba/consent" element={<SBAConsent />} />
                <Route path="/sba-portal/consent" element={<SBAConsent />} />
                <Route path="/sba/intake" element={<SBAIntake />} />
                <Route path="/sba-portal/intake" element={<SBAIntake />} />
                <Route path="/sba/documents" element={<SBADocuments />} />
                <Route path="/sba-portal/documents" element={<SBADocuments />} />
                <Route path="/sba/packet" element={<SBAPacket />} />
                <Route path="/sba-portal/packet" element={<SBAPacket />} />
                <Route path="/sba/dashboard" element={<SBADashboard />} />
                <Route path="/sba-portal/dashboard" element={<SBADashboard />} />
                <Route path="/sba/admin" element={<SBAAdmin />} />
                <Route path="/sba-portal/admin" element={<SBAAdmin />} />
                
                {/* Existing Routes */}
                <Route path="/" element={<Index />} />
              <Route 
                path="/dispute-center" 
                element={
                  <ProtectedRoute requiredFeature="dispute-generator" featureName="Dispute Center">
                    <DisputeCenter />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/data-freeze" 
                element={
                  <ProtectedRoute requiredFeature="dispute-generator" featureName="Data Freeze Center">
                    <DataFreezeCenter />
                  </ProtectedRoute>
                } 
              />
              <Route path="/onboarding" element={<ClientOnboarding />} />
              <Route 
                path="/documents" 
                element={
                  <ProtectedRoute requiredFeature="credit-upload" featureName="Document Upload">
                    <DocumentUpload />
                  </ProtectedRoute>
                } 
              />
              <Route path="/membership" element={<MembershipPricing />} />
              <Route path="/membership-success" element={<MembershipSuccess />} />
              <Route 
                path="/education" 
                element={
                  <ProtectedRoute requiredFeature="education" featureName="Education Center">
                    <Education />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/credit-tracking" 
                element={
                  <ProtectedRoute requiredFeature="dashboard" featureName="Credit Tracking">
                    <CreditTracking />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/credit-building" 
                element={
                  <ProtectedRoute requiredFeature="credit-building" featureName="Credit Building Center">
                    <CreditBuildingCenter />
                  </ProtectedRoute>
                } 
              />
              <Route path="/goodwill-letters" element={<GoodwillLetters />} />
              <Route path="/credit-monitoring" element={<CreditMonitoring />} />
              <Route 
                path="/upload-credit-report" 
                element={
                  <ProtectedRoute requiredFeature="credit-upload" featureName="Credit Report Upload">
                    <CreditReportUploadPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ai-assistant" 
                element={
                  <ProtectedRoute requiredFeature="dashboard" featureName="AI Credit Assistant">
                    <AICreditAssistantPage />
                  </ProtectedRoute>
                } 
               />
               <Route 
                 path="/document-center" 
                 element={
                   <ProtectedRoute requiredFeature="dashboard" featureName="Document Upload Center">
                     <DocumentUploadCenter />
                   </ProtectedRoute>
                 } 
               />
               <Route 
                 path="/score-tracker" 
                 element={
                   <ProtectedRoute requiredFeature="dashboard" featureName="Credit Score Tracker">
                     <CreditScoreTracker />
                   </ProtectedRoute>
                 } 
               />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin/clients" element={<AdminClients />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/tools" element={<AdminTools />} />
              <Route path="/admin/cashapp" element={<AdminCashApp />} />
              <Route path="/checkout" element={<CashAppCheckout />} />
              <Route path="/client-portals" element={<ClientPortalLinks />} />
              <Route path="/client/:clientSlug" element={<ClientPortals />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </MembershipProvider>
      </RolesProvider>
    </AuthProvider>
  </SBAConfigProvider>
</QueryClientProvider>
</ErrorBoundary>
);

export default App;
