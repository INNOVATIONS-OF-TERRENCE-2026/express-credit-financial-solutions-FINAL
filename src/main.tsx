import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { MembershipProvider } from "@/hooks/useMembership";
import { RolesProvider } from "@/hooks/useRoles";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RolesProvider>
          <MembershipProvider>
            <App />
          </MembershipProvider>
        </RolesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
