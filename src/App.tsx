import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequireAccess from "./components/routing/RequireAccess";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// App pages (protected)
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Properties from "./pages/Properties";
import Leases from "./pages/Leases";
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
import Offers from "./pages/marketing/Offers";
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
import NotFound from "./pages/NotFound";
import { MarketingLayout } from "./components/marketing/marketing-layout";
import { useEffect, useRef } from "react";


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
function DebugAuthPanel() {
  const { user, loading, initialized, profile, subscription } = useAuth();
  return (
    <div className="fixed top-2 right-2 text-xs bg-black/70 text-white p-2 rounded shadow">
      <div>user: {String(!!user)}</div>
      <div>loading: {String(loading)}</div>
      <div>initialized: {String(initialized)}</div>
      <div>trial_end_date: {profile?.trial_end_date ?? '—'}</div>
      <div>sub.status: {subscription?.status ?? '—'}</div>
    </div>
  );
}


const AuthenticatedApp = () => {
  const { user, loading, initialized, profile, subscription } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navOnce = useRef(false);

  // Helpers purs
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const parseDateOnlyMs = (s?: string | null) => {
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).setHours(0, 0, 0, 0); }
    const dt = new Date(s); return isNaN(dt.getTime()) ? null : startOfDay(dt);
  };

  // 👉 gating minimal : on ne bloque que sur initialized
  //const appReady = initialized && !loading;
  const appReady = initialized;

  // Derivés "best effort"
  const subAny = subscription as any;
  const subStatus = (subAny?.subscription_status ?? subAny?.status ?? "").toLowerCase();
  const isSubscribed = subStatus === "active" || subStatus === "trialing" || subStatus === "past_due";

  const trialRef = subAny?.trial_end ?? profile?.trial_end_date ?? null;
  const trialEndMs = parseDateOnlyMs(trialRef);
  const trialValid = trialEndMs !== null && trialEndMs > startOfDay(new Date());
  console.log('[APP] initialized:', initialized, 'loading:', loading, 'user:', user);
  // Si sub/profile sont inconnus (null/undefined), on ne décide pas => undefined
  const mustPay: boolean | undefined =
    typeof subAny === "undefined" && typeof profile === "undefined"
      ? undefined
      : (!isSubscribed && !trialValid);

  // Navigation unique après stabilisation
  useEffect(() => {
    if (!appReady || navOnce.current) return;

    // 1) non connecté -> /auth (publique)
    if (!user) {
      if (location.pathname !== "/auth") {
        navOnce.current = true;
        navigate("/auth", { replace: true });
      }
      return;
    }

    // 2) connecté -> ne navigue que si décision claire
    if (mustPay === true && location.pathname !== "/app/paywall") {
      navOnce.current = true;
      navigate("/app/paywall", { replace: true });
      return;
    }
    if (mustPay === false && location.pathname === "/app/paywall") {
      navOnce.current = true;
      navigate("/app", { replace: true });
      return;
    }
    // mustPay === undefined => on ne bouge pas (on laisse l'app se charger)
  }, [appReady, user, mustPay, location.pathname, navigate]);

  // 🔁 Important : quand l’URL change, on autorise une nouvelle navigation unique
  useEffect(() => { navOnce.current = false; }, [location.pathname]);

  // Spinner uniquement tant que initialized n’est pas terminé
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement…</div>
      </div>
    );
  }


  return (
    <Layout>
      <Routes>
        {/* Toutes les routes protégées passent par le garde */}
        <Route element={<RequireAccess />}>
          <Route index element={<Index />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="properties" element={<Properties />} />
          <Route path="leases" element={<Leases />} />
          <Route path="leases/:id" element={<LeaseDetail />} />
          <Route path="people" element={<People />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="documents" element={<Documents />} />
          <Route path="communications" element={<Communications />} />
          <Route path="reports" element={<Reports />} />
          <Route path="tools/tri" element={<TRISimulator />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Le paywall est en dehors du garde pour pouvoir y accéder */}
        <Route path="paywall" element={<TrialPaywall />} />
        {/* <Route path="auth" element={<Auth />} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>{/* ← ICI: un seul provider autour de toute l’app */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* <DebugAuthPanel /> */}
        <BrowserRouter>
          <Routes>
            {/* Marketing routes (public) */}
            <Route path="/" element={<MarketingLayout><Landing /></MarketingLayout>} />
            <Route path="/features" element={<MarketingLayout><Features /></MarketingLayout>} />
            <Route path="/faq" element={<MarketingLayout><FAQ /></MarketingLayout>} />
            <Route path="/about" element={<MarketingLayout><About /></MarketingLayout>} />
            <Route path="/contact" element={<MarketingLayout><Contact /></MarketingLayout>} />
            <Route path="/resources" element={<MarketingLayout><Resources /></MarketingLayout>} />
            <Route path="/legal/terms" element={<MarketingLayout><Terms /></MarketingLayout>} />
            <Route path="/legal/privacy" element={<MarketingLayout><Privacy /></MarketingLayout>} />
            <Route path="/legal/imprint" element={<MarketingLayout><Imprint /></MarketingLayout>} />
            <Route path="offers" element={<MarketingLayout><Offers /></MarketingLayout>} />

            {/* ✅ Routes d'auth publiques au niveau racine */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* App (authenticated) */}
            <Route path="/app/*" element={<AuthenticatedApp />} />

            {/* ✅ Catch-all racine */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
