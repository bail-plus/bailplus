import { useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { PublicLayout } from "@/components/PublicLayout";
import { ProtectedApp } from '@/components/ProtectedApp';
import { AuthProvider, useAuth } from "@/hooks/useAuth";

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
import TrialPaywall from "./pages/TrialPaywall";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Offers from "./pages/Offers";
import Auth from "./pages/Auth";

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
import { MarketingLayout } from "./components/marketing/marketing-layout";


const queryClient = new QueryClient();
/** Helpers dates (locale) */
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

// Accepte 'YYYY-MM-DD' ou timestamp ISO
const parseDateLocalMs = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const [, Y, M, D] = m;
    return startOfDay(new Date(Number(Y), Number(M) - 1, Number(D)));
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return startOfDay(d);
};

const AuthenticatedApp = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  console.log("trial end date (raw)", profile?.trial_end_date ?? null);
  const trialEndRaw = profile?.trial_end_date ?? null; // "YYYY-MM-DD"
  const trialEndMs = parseDateLocalMs(trialEndRaw);
  const todayMs = startOfDay(new Date());
  const shouldGoPaywall = trialEndMs !== null && trialEndMs >= todayMs;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  if (shouldGoPaywall && location.pathname !== "/app/paywall") {
    return <Navigate to="/app/paywall" replace />;
  }


  // Sinon, routes de l'app
  return (
    <Layout>
      <Routes>
        {/* <Route path="/paywall" element={<div style={{ padding: 24 }}>PAYWALL OK ✅</div>} /> */}
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
        <Route path="/tools/tri" element={<TRISimulator />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/paywall" element={<TrialPaywall />} />

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
          {/* <Route path="/pricing" element={<MarketingLayout><Pricing /></MarketingLayout>} /> */}
          <Route path="/faq" element={<MarketingLayout><FAQ /></MarketingLayout>} />
          <Route path="/about" element={<MarketingLayout><About /></MarketingLayout>} />
          <Route path="/contact" element={<MarketingLayout><Contact /></MarketingLayout>} />
          <Route path="/resources" element={<MarketingLayout><Resources /></MarketingLayout>} />
          <Route path="/legal/terms" element={<MarketingLayout><Terms /></MarketingLayout>} />
          <Route path="/legal/privacy" element={<MarketingLayout><Privacy /></MarketingLayout>} />
          <Route path="/legal/imprint" element={<MarketingLayout><Imprint /></MarketingLayout>} />

          {/* App routes (authenticated) */}
          <Route
            path="/app/*"
            element={
              <AuthProvider>
                <AuthenticatedApp />
              </AuthProvider>
            }
          />

          {/* 404 */}
          {/* <Route path="*" element={<MarketingLayout><MarketingNotFound /></MarketingLayout>} /> */}
        </Routes>
      </BrowserRouter>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;