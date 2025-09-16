// src/components/routing/RequireAccess.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const parseDateOnlyMs = (s?: string | null): number | null => {
  if (!s) return null;
  // Format YYYY-MM-DD (sans heure)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).setHours(0, 0, 0, 0);
  }
  // Autres formats parsables par Date
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : startOfDay(new Date(t));
};

export default function RequireAccess() {
  const loc = useLocation();
  const { initialized, loading, user, sub, profile } = useAuth() as any;

  // Évite les ping-pong de navigation le temps que l’auth charge
  if (!initialized || loading) return <Outlet />;

  const todayMs = startOfDay(new Date());

  // 1) On récupère la date d’essai depuis Stripe ET le profil
  const trialFromSubMs = parseDateOnlyMs(sub?.trial_end);
  const trialFromProfileMs = parseDateOnlyMs(profile?.trial_end_date);

  // 2) On prend la date la plus tôt (la plus stricte)
  const trials = [trialFromSubMs, trialFromProfileMs].filter(
    (n): n is number => typeof n === "number"
  );
  const trialEndMs: number | null = trials.length ? Math.min(...trials) : null;

  // 3) Abonné si Stripe est "active" ou "trialing"
  const subStatus: string | null = sub?.status ?? null;
  const isSubscribed = subStatus === "active" || subStatus === "trialing";

  // 4) VALIDITÉ DU TRIAL — "égal à aujourd’hui" = expiré (donc on met > et pas >=)
  const trialValid = trialEndMs !== null && trialEndMs > todayMs;

  const mustPay = !isSubscribed && !trialValid;

  if (import.meta.env.DEV) {
    console.log("[GATE]", {
      path: loc.pathname,
      subStatus,
      isSubscribed,
      trialFromSubMs,
      trialFromProfileMs,
      trialEndMs,
      todayMs,
      trialValid,
      mustPay,
    });
  }

  // 5) Redirection vers la paywall si nécessaire (pas de boucle si on y est déjà)
  if (mustPay && !loc.pathname.endsWith("/paywall")) {
    return <Navigate to="/app/paywall" replace state={{ from: loc }} />;
  }

  return <Outlet />;
}
