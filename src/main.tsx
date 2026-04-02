import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAnalytics } from "@/utils/analytics";

// Initialize SEO analytics and Core Web Vitals tracking
if (typeof window !== 'undefined') {
  initializeAnalytics();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
