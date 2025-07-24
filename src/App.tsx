import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { MembershipProvider } from "./hooks/useMembership";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { DisputeCenter } from "./pages/DisputeCenter";
import { ClientOnboarding } from "./pages/ClientOnboarding";
import { DocumentUpload } from "./pages/DocumentUpload";
import MembershipPricing from "./pages/MembershipPricing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MembershipProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </MembershipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
