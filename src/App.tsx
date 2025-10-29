import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/hooks/auth/useAuth";
import { RequireAuth, RequireSubscription } from "@/guards";
import { RequireCompleteProfile } from "@/guards/RequireCompleteProfile";

// App pages (protected)
import Index from "./pages/app/Index";
import Calendar from "./pages/app/Calendar";
import Properties from "./pages/app/Properties";
import Leases from "./pages/app/Leases";
import LeaseDetail from "./pages/app/LeaseDetail";
import People from "./pages/app/People";
import Providers from "./pages/app/Providers";
import ProviderProfile from "./pages/app/ProviderProfile";
import Maintenance from "./pages/app/Maintenance";
import Accounting from "./pages/app/Accounting";
import Documents from "./pages/app/Documents";
import Communications from "./pages/app/Communications";
import Reports from "./pages/app/Reports";
import Settings from "./pages/account/Settings";
import BankCallback from "./pages/settings/BankCallback";
import TRISimulator from "./pages/app/tools/TRISimulator";
import TrialPaywall from "./pages/account/TrialPaywall";

// Auth pages
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ChangeEmail from "./pages/account/ChangeEmail";
import LostEmailAccess from "./pages/auth/LostEmailAccess";
import AcceptInvitation from "./pages/auth/AcceptInvitation";
import CompleteProfile from "./pages/auth/CompleteProfile";
import Offers from "./pages/marketing/Offers";
import Auth from "./pages/auth/Auth";

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

// 404 page
import NotFound from "./pages/NotFound";
import { MarketingLayout } from "./components/marketing/marketing-layout";

// IMPORTANT: Créer le QueryClient EN DEHORS du composant pour éviter qu'il soit recréé à chaque render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes - les données sont fraîches pendant 5 min
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false, // Ne pas refetch quand on revient sur l'onglet
      refetchOnMount: true, // Refetch au mount SI les données sont stale
      refetchOnReconnect: false,
    },
  },
});

function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
            <Route path="/offers" element={<MarketingLayout><Offers /></MarketingLayout>} />

            {/* Auth routes (public) */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/lost-email-access" element={<LostEmailAccess />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />

            {/* Protected app routes */}
            <Route element={<RequireAuth />}>
              {/* Complete profile - accessible pour les utilisateurs authentifiés, avant RequireCompleteProfile */}
              <Route path="/complete-profile" element={<CompleteProfile />} />

              {/* Routes qui nécessitent un profil complet */}
              <Route element={<RequireCompleteProfile />}>
                <Route path="/app" element={<Layout><Navigate to="/app/dashboard" replace /></Layout>} />

                {/* Paywall accessible pour les utilisateurs authentifiés sans abonnement */}
                <Route path="/app/paywall" element={<Layout><TrialPaywall /></Layout>} />

                {/* Change email - accessible pour tous les utilisateurs authentifiés */}
                <Route path="/app/change-email" element={<ChangeEmail />} />

                {/* Bank callback - page de transition après connexion bancaire */}
                <Route path="/settings/bank-callback" element={<BankCallback />} />

                {/* Routes protégées par l'abonnement */}
                <Route element={<RequireSubscription />}>
                  <Route path="/app/dashboard" element={<Layout><Index /></Layout>} />
                  <Route path="/app/calendar" element={<Layout><Calendar /></Layout>} />
                  <Route path="/app/properties" element={<Layout><Properties /></Layout>} />
                  <Route path="/app/leases" element={<Layout><Leases /></Layout>} />
                  <Route path="/app/leases/:id" element={<Layout><LeaseDetail /></Layout>} />
                  <Route path="/app/people" element={<Layout><People /></Layout>} />
                  <Route path="/app/providers" element={<Layout><Providers /></Layout>} />
                  <Route path="/app/provider-profile" element={<Layout><ProviderProfile /></Layout>} />
                  <Route path="/app/maintenance" element={<Layout><Maintenance /></Layout>} />
                  <Route path="/app/accounting" element={<Layout><Accounting /></Layout>} />
                  <Route path="/app/documents" element={<Layout><Documents /></Layout>} />
                  <Route path="/app/communications" element={<Layout><Communications /></Layout>} />
                  <Route path="/app/reports" element={<Layout><Reports /></Layout>} />
                  <Route path="/app/tools/tri" element={<Layout><TRISimulator /></Layout>} />
                  <Route path="/app/settings" element={<Layout><Settings /></Layout>} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
}

export default App;
