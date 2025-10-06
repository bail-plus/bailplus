import { useState, useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Helpers pour la validation des dates
 */
const startOfDay = (d: Date): number => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const parseDateOnly = (s?: string | null): number | null => {
  if (!s) return null;

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).setHours(0, 0, 0, 0);
  }

  // Autre format de date
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : startOfDay(dt);
};

/**
 * Guard qui vérifie que l'utilisateur a un accès valide
 * (abonnement actif OU trial valide)
 * Si pas d'accès, redirige vers /app/paywall
 */
export function RequireSubscription() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('[GUARD/SUB] Render #', renderCount.current);

  const { profile, subscription, isReady } = useAuth();
  const [forceReady, setForceReady] = useState(false);

  console.log('[GUARD/SUB]', {
    isReady,
    forceReady,
    hasProfile: !!profile,
    hasSubscription: !!subscription,
    willWait: !isReady && !forceReady
  });

  // Timeout de sécurité : forcer le passage après 10 secondes (au lieu de 5)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isReady) {
        console.warn('[GUARD/SUB] ⚠️ Forcing ready after timeout');
        setForceReady(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isReady]);

  // Attendre que le profil et l'abonnement soient complètement chargés
  if (!isReady && !forceReady) {
    console.log('[GUARD/SUB] WAITING - showing loader...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  // Vérifier l'abonnement
  const subStatus = (subscription?.subscription_status ?? "").toLowerCase();
  const hasActiveSubscription =
    subscription?.subscribed ||
    subStatus === "active" ||
    subStatus === "trialing" ||
    subStatus === "past_due";

  // Vérifier le trial
  const trialEndMs = parseDateOnly(profile?.trial_end_date);
  const todayMs = startOfDay(new Date());
  const hasValidTrial = trialEndMs !== null && trialEndMs > todayMs;

  // MODE DEBUG: Toujours autoriser l'accès si VITE_DEBUG_SKIP_PAYWALL est défini
  if (import.meta.env.VITE_DEBUG_SKIP_PAYWALL === 'true') {
    return <Outlet />;
  }

  // Si ni abonnement ni trial valide, rediriger vers le paywall
  // MAIS seulement si on a bien récupéré les données (pas juste timeout)
  if (!hasActiveSubscription && !hasValidTrial) {
    // Si on a forcé le passage après timeout et qu'il n'y a pas de données du tout,
    // ne pas rediriger car c'est peut-être juste un problème réseau temporaire
    if (forceReady && !profile && !subscription) {
      console.warn('[GUARD/SUB] Forced ready without data - allowing access to avoid false redirect');
      return <Outlet />;
    }

    return <Navigate to="/app/paywall" replace />;
  }

  // Accès valide, afficher les routes enfants
  return <Outlet />;
}
