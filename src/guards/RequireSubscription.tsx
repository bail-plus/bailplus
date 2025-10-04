import { useState, useEffect } from 'react';
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
  const { profile, subscription, isReady } = useAuth();
  const [forceReady, setForceReady] = useState(false);

  // Timeout de sécurité : forcer le passage après 5 secondes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isReady) {
        console.warn('[GUARD/SUB] ⚠️ Forcing ready after timeout');
        setForceReady(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isReady]);

  // Attendre que le profil et l'abonnement soient complètement chargés
  if (!isReady && !forceReady) {
    console.log('[GUARD/SUB] Waiting for data to load... (isReady = false)');
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

  console.log('[GUARD/SUB] Subscription check:', {
    profile: {
      trial_end_date: profile?.trial_end_date,
      trialEndMs,
      todayMs,
    },
    subscription: {
      exists: !!subscription,
      subscribed: subscription?.subscribed,
      status: subscription?.subscription_status,
      subStatus,
    },
    result: {
      hasActiveSubscription,
      hasValidTrial,
      willRedirectToPaywall: !hasActiveSubscription && !hasValidTrial,
    }
  });

  // Si ni abonnement ni trial valide, rediriger vers le paywall
  if (!hasActiveSubscription && !hasValidTrial) {
    console.log('[GUARD/SUB] ❌ Access denied - Redirecting to paywall');
    return <Navigate to="/app/paywall" replace />;
  }

  console.log('[GUARD/SUB] ✅ Access granted');
  // Accès valide, afficher les routes enfants
  return <Outlet />;
}
