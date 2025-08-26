
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { PublicLayout } from "@/components/PublicLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";

// App pages (protected)
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Properties from "./pages/Properties";
import Leasing from "./pages/Leasing";
import LeaseDetail from "./pages/LeaseDetail";
import People from "./pages/People";
import Maintenance from "./pages/Maintenance";
import Accounting from "./pages/Accounting";
import Documents from "./pages/Documents";
import Communications from "./pages/Communications";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import TRISimulator from "./pages/TRISimulator";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Offers from "./pages/Offers";

// Public/Marketing pages
import Landing from "./pages/marketing/Landing";
import Features from "./pages/marketing/Features";
import Pricing from "./pages/marketing/Pricing";
import FAQ from "./pages/marketing/FAQ";
import About from "./pages/marketing/About";
import Contact from "./pages/marketing/Contact";
import Resources from "./pages/marketing/Resources";
import Terms from "./pages/marketing/legal/Terms";
import Privacy from "./pages/marketing/legal/Privacy";
import Imprint from "./pages/marketing/legal/Imprint";

// 404 pages
import NotFoundPublic from "./pages/NotFoundPublic";
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
            {/* Redirect /App to /app (legacy route) */}
            <Route path="/App/*" element={<Navigate to="/app" replace />} />
            
            {/* Public routes */}
            <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
            <Route path="/features" element={<PublicLayout><Features /></PublicLayout>} />
            <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
            <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            <Route path="/resources" element={<PublicLayout><Resources /></PublicLayout>} />
            <Route path="/legal/terms" element={<PublicLayout><Terms /></PublicLayout>} />
            <Route path="/legal/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />
            <Route path="/legal/imprint" element={<PublicLayout><Imprint /></PublicLayout>} />
            
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/offers" element={<Offers />} />
            
            {/* Protected app routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <Layout>
                  <Index />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/calendar" element={
              <ProtectedRoute>
                <Layout>
                  <Calendar />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/properties" element={
              <ProtectedRoute>
                <Layout>
                  <Properties />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/leasing" element={
              <ProtectedRoute>
                <Layout>
                  <Leasing />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/leases/:id" element={
              <ProtectedRoute>
                <Layout>
                  <LeaseDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/people" element={
              <ProtectedRoute>
                <Layout>
                  <People />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/maintenance" element={
              <ProtectedRoute>
                <Layout>
                  <Maintenance />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/accounting" element={
              <ProtectedRoute>
                <Layout>
                  <Accounting />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/documents" element={
              <ProtectedRoute>
                <Layout>
                  <Documents />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/communications" element={
              <ProtectedRoute>
                <Layout>
                  <Communications />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/reports" element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/tools/tri" element={
              <ProtectedRoute>
                <Layout>
                  <TRISimulator />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/app/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* 404 for app routes */}
            <Route path="/app/*" element={
              <ProtectedRoute>
                <Layout>
                  <NotFound />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* 404 for public routes */}
            <Route path="*" element={<PublicLayout><NotFoundPublic /></PublicLayout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
