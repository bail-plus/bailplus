import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
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
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
      <AuthProvider>
        <BrowserRouter>
          <AuthenticatedApp />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
