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
import Test from "./pages/Test";

// Enhanced components
import EnhancedDashboard from "./pages/EnhancedDashboard";
import { ThirdPartyBureauDisputes } from "./components/ThirdPartyBureauDisputes";
import { USPSMailService } from "./components/USPSMailService";

const queryClient = new QueryClient();

const App = () => {
  console.log('App: Rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Test route - no authentication required */}
              <Route path="/test" element={<Test />} />
              
              {/* Enhanced Dashboard */}
              <Route path="/" element={
                <ProtectedRoute>
                  <EnhancedDashboard />
                </ProtectedRoute>
              } />
              
              {/* Existing routes */}
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
              <Route path="/letters/new" element={
                <ProtectedRoute>
                  <Letters />
                </ProtectedRoute>
              } />
              <Route path="/letters" element={
                <ProtectedRoute>
                  <Letters />
                </ProtectedRoute>
              } />
              <Route path="/debug" element={
                <ProtectedRoute>
                  <Debug />
                </ProtectedRoute>
              } />
              
              {/* New enhanced routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <EnhancedDashboard />
                </ProtectedRoute>
              } />
              <Route path="/third-party-bureaus" element={
                <ProtectedRoute>
                  <ThirdPartyBureauDisputes />
                </ProtectedRoute>
              } />
              <Route path="/mail-service" element={
                <ProtectedRoute>
                  <USPSMailService />
                </ProtectedRoute>
              } />
              
              {/* Placeholder routes for future features */}
              <Route path="/disputes" element={<Navigate to="/third-party-bureaus" replace />} />
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
};

export default App;
