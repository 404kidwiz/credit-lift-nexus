import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreditReportUpload from "./pages/CreditReportUpload";
import AIUpload from "./pages/AIUpload";
import AnalysisResults from "./pages/AnalysisResults";
import Letters from "./pages/Letters";
import Debug from "./pages/Debug";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/upload" element={
              <ProtectedRoute>
                <CreditReportUpload />
              </ProtectedRoute>
            } />
            <Route path="/ai-upload" element={
              <ProtectedRoute>
                <AIUpload />
              </ProtectedRoute>
            } />
            <Route path="/analysis/:reportId" element={
              <ProtectedRoute>
                <AnalysisResults />
              </ProtectedRoute>
            } />
            <Route path="/letters/:reportId" element={
              <ProtectedRoute>
                <Letters />
              </ProtectedRoute>
            } />
            <Route path="/debug" element={
              <ProtectedRoute>
                <Debug />
              </ProtectedRoute>
            } />
            {/* Placeholder routes for future features */}
            <Route path="/disputes" element={<Navigate to="/" replace />} />
            <Route path="/violations" element={<Navigate to="/" replace />} />
            <Route path="/progress" element={<Navigate to="/" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
