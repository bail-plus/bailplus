import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
  console.log("trial end date (raw)", profile?.trial_end_date ?? null);
  const trialEndRaw = profile?.trial_end_date ?? null; // "YYYY-MM-DD"


  const parseDateLocalMs = (s?: string | null) => s ? startOfDay(new Date(s)) : null;

  // // ⚠️ Tu as dit de ne pas toucher au paywall : je ne change PAS la ligne suivante
  // const shouldGoPaywall = trialEndMs !== null && trialEndMs >= todayMs;
  console.log("!user", !user);
  console.log("loading", loading);

  console.log('[APP]', {
    user: !!user,
    loading,
    initialized,
    trialEnd: profile?.trial_end_date ?? null,
    subStatus: subscription?.status ?? null,
  });

  // helpers
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const parseDateOnlyMs = (s?: string | null) => {
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).setHours(0, 0, 0, 0); }
    const dt = new Date(s); return isNaN(dt.getTime()) ? null : startOfDay(dt);
  };

  // ⚠️ normalisation pour tolérer plusieurs schémas
  const subAny = subscription as any;
  const subStatus = (subAny?.subscription_status ?? subAny?.status ?? "").toLowerCase();
  const isSubscribed = subStatus === "active" || subStatus === "trialing" || subStatus === "past_due";

  const trialRef = subAny?.trial_end ?? profile?.trial_end_date ?? null;
  const trialEndMs = parseDateOnlyMs(trialRef);
  const trialValid = trialEndMs !== null && trialEndMs > startOfDay(new Date());

  // 👉 décision d’accès
  const mustPay = !isSubscribed && !trialValid;

  // ✅ NE DÉCIDE QUE SI ON A AU MOINS UNE INFO FIABLE
  const hasSubKnown = !!subAny && (typeof subAny.status !== "undefined" || typeof subAny.subscription_status !== "undefined");
  const hasTrialKnown = typeof profile?.trial_end_date !== "undefined"; // false tant que profile pas hydraté
  const decisionReady = hasSubKnown || hasTrialKnown;

  console.log("[GATE]", { path: location.pathname, subStatus, isSubscribed, trialRef, trialEndMs, trialValid, mustPay, hasSubKnown, hasTrialKnown, decisionReady });



  // spinners init
  if (!initialized ) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center">Chargement...</div></div>;
  }
  if (!user) return <Auth />;
  console.log("isSubscribed", isSubscribed);
  console.log("trialEndMs", trialEndMs);
  console.log("trialValid", trialValid);
  console.log("mustPay", mustPay);
  console.log("user", user.user_metadata );


  // ⛔️ ne redirige que si la décision est prête
  if (decisionReady) {
    if (mustPay && location.pathname !== "/app/paywall") {
      return <Navigate to="/app/paywall" replace />;
    }
    if (!mustPay && location.pathname === "/app/paywall") {
      return <Navigate to="/app" replace />;
    }
  }

  // if (shouldGoPaywall && location.pathname !== "/app/paywall") {
  //   return <Navigate to="/app/paywall" replace />;
  // }


  return (
    <Layout>
      <Routes>
        {/* Toutes les routes protégées passent par le garde */}
        <Route element={<RequireAccess />}>
          <Route index element={<Index />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="properties" element={<Properties />} />
          <Route path="leasing" element={<Leasing />} />
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

        <Route path="auth" element={<Auth />} />
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

            {/* App routes (authenticated) */}
            <Route path="/app/*" element={<AuthenticatedApp />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
