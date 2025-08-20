import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// App pages
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
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Marketing pages
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
import MarketingNotFound from "./pages/marketing/NotFound";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/leasing" element={<Leasing />} />
        <Route path="/leases/:id" element={<LeaseDetail />} />
        <Route path="/people" element={<People />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Marketing routes (public) */}
          <Route path="/" element={<MarketingLayout><Landing /></MarketingLayout>} />
          <Route path="/features" element={<MarketingLayout><Features /></MarketingLayout>} />
          <Route path="/pricing" element={<MarketingLayout><Pricing /></MarketingLayout>} />
          <Route path="/faq" element={<MarketingLayout><FAQ /></MarketingLayout>} />
          <Route path="/about" element={<MarketingLayout><About /></MarketingLayout>} />
          <Route path="/contact" element={<MarketingLayout><Contact /></MarketingLayout>} />
          <Route path="/resources" element={<MarketingLayout><Resources /></MarketingLayout>} />
          <Route path="/legal/terms" element={<MarketingLayout><Terms /></MarketingLayout>} />
          <Route path="/legal/privacy" element={<MarketingLayout><Privacy /></MarketingLayout>} />
          <Route path="/legal/imprint" element={<MarketingLayout><Imprint /></MarketingLayout>} />
          
          {/* App routes (authenticated) */}
          <Route path="/app/*" element={
            <AuthProvider>
              <AuthenticatedApp />
            </AuthProvider>
          } />
          
          {/* 404 */}
          <Route path="*" element={<MarketingLayout><MarketingNotFound /></MarketingLayout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
