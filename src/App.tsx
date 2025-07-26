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
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { DisputeCenter } from "./pages/DisputeCenter";
import { DataFreezeCenter } from "./pages/DataFreezeCenter";
import { ClientOnboarding } from "./pages/ClientOnboarding";
import { DocumentUpload } from "./pages/DocumentUpload";
import MembershipPricing from "./pages/MembershipPricing";
import MembershipSuccess from "./pages/MembershipSuccess";
import Education from "./pages/Education";
import CreditTracking from "./pages/CreditTracking";
import CreditBuildingCenter from "./pages/CreditBuildingCenter";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { GoodwillLetters } from "./pages/GoodwillLetters";
import { CreditMonitoring } from "./pages/CreditMonitoring";
import { CreditReportUploadPage } from "./pages/CreditReportUploadPage";
import { AICreditAssistantPage } from "./pages/AICreditAssistantPage";
import { DocumentUploadCenter } from "./pages/DocumentUploadCenter";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RolesProvider>
          <MembershipProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <FloatingChat />
            <BrowserRouter>
            <Routes>
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
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </MembershipProvider>
      </RolesProvider>
    </AuthProvider>
  </QueryClientProvider>
</ErrorBoundary>
);

export default App;
