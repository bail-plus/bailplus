import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { PublicLayout } from "@/components/PublicLayout";
import { ProtectedApp } from '@/components/ProtectedApp';
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
            
            {/* Subscription Management - Public access */}
            <Route path="/offers" element={<Offers />} />
            
            {/* Legacy redirects - All subscription routes go to /offers */}
            <Route path="/tarifs" element={<Navigate to="/offers" replace />} />
            <Route path="/pricing" element={<Navigate to="/offers" replace />} />
            <Route path="/plans" element={<Navigate to="/offers" replace />} />
            <Route path="/abonnement" element={<Navigate to="/offers" replace />} />
            <Route path="/subscription" element={<Navigate to="/offers" replace />} />
            
            {/* Protected App Routes - Require Active Subscription */}
            <Route path="/app" element={
              <ProtectedApp>
                <Layout>
                  <Index />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/calendar" element={
              <ProtectedApp>
                <Layout>
                  <Calendar />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/properties" element={
              <ProtectedApp>
                <Layout>
                  <Properties />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/leasing" element={
              <ProtectedApp>
                <Layout>
                  <Leasing />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/leases/:id" element={
              <ProtectedApp>
                <Layout>
                  <LeaseDetail />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/people" element={
              <ProtectedApp>
                <Layout>
                  <People />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/maintenance" element={
              <ProtectedApp>
                <Layout>
                  <Maintenance />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/accounting" element={
              <ProtectedApp>
                <Layout>
                  <Accounting />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/documents" element={
              <ProtectedApp>
                <Layout>
                  <Documents />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/communications" element={
              <ProtectedApp>
                <Layout>
                  <Communications />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/reports" element={
              <ProtectedApp>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/settings" element={
              <ProtectedApp>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedApp>
            } />
            <Route path="/app/tri-simulator" element={
              <ProtectedApp>
                <Layout>
                  <TRISimulator />
                </Layout>
              </ProtectedApp>
            } />
            
            {/* 404 for app routes */}
            <Route path="/app/*" element={
              <ProtectedApp>
                <Layout>
                  <NotFound />
                </Layout>
              </ProtectedApp>
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