import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, CreditCard, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type ProfileLite = {
  trial_end_date: string | null; // "YYYY-MM-DD" recommandé en DB (DATE)
  role: string | null;
};

const ENABLE_AUTO_REDIRECT_IF_EXPIRED = false; // passe à true si tu veux rediriger vers Stripe automatiquement quand expiré

function toDateOnly(d: Date) {
  // retourne "YYYY-MM-DD" en UTC (parfait pour comparer des dates-calendrier)
  return d.toISOString().split("T")[0];
}

export default function TrialPaywall() {
  const { user, profile: ctxProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // État local uniquement si le contexte n'apporte pas ce qu'il faut
  const [fetchedProfile, setFetchedProfile] = useState<ProfileLite | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modes debug: ?debugTrial=expired|today|active
  const params = new URLSearchParams(location.search);
  const debugMode = params.get("debugTrial"); // 'expired' | 'today' | 'active' | null

  // ----- Chargement profil (fallback si pas dans le contexte) -----
  useEffect(() => {
    let cancelled = false;

    const needFetch =
      !!user &&
      (!ctxProfile || ctxProfile.trial_end_date == null || ctxProfile.role == null);

    if (!needFetch) {
      setFetchedProfile(null); // on s'appuie sur le contexte
      return;
    }

    (async () => {
      try {
        setLoadingProfile(true);
        setError(null);
        // ⚠️ mets le bon nom de table: 'profile' ou 'profiles'
        const { data, error } = await supabase
          .from("profiles")
          .select("trial_end_date, role")
          .eq("user_id", user!.id) // FK vers auth.users.id
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setError(error.message);
          setFetchedProfile(null);
        } else {
          setFetchedProfile((data as ProfileLite) ?? { trial_end_date: null, role: null });
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, ctxProfile]);

  // Profil effectif (contexte prioritaire)
  const effectiveProfile: ProfileLite | null = ctxProfile
    ? { trial_end_date: ctxProfile.trial_end_date ?? null, role: (ctxProfile as any).role ?? null }
    : fetchedProfile;

  // ----- Dates / règles métier -----
  const todayStr = useMemo(() => toDateOnly(new Date()), []);
  const trialEndStr = useMemo(() => {
    // 1) Debug via querystring
    if (debugMode === "expired") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return toDateOnly(d);
    }
    if (debugMode === "today") {
      return todayStr;
    }
    if (debugMode === "active") {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return toDateOnly(d);
    }

    // 2) Profil (DB)
    if (effectiveProfile?.trial_end_date) {
      // Si c'est déjà au format "YYYY-MM-DD", c'est idempotent
      return toDateOnly(new Date(effectiveProfile.trial_end_date));
    }

    // 3) Fallback doux: si pas de date en DB, on suppose 14j après création du compte
    if (user?.created_at) {
      const end = new Date(user.created_at);
      end.setDate(end.getDate() + 14);
      return toDateOnly(end);
    }

    return null;
  }, [debugMode, effectiveProfile?.trial_end_date, user?.created_at, todayStr]);

  const isEndingToday = !!trialEndStr && trialEndStr === todayStr;
  // Ta règle App => paywall quand trial_end_date >= today.
  // Ici on veut distinguer l'affichage:
  // - expiré: trial_end < today
  // - dernier jour: trial_end === today
  // - actif: trial_end > today
  const isExpired = trialEndStr ? trialEndStr < todayStr : false;

  // ----- Auto-redirect Stripe si expiré (optionnel) -----
  useEffect(() => {
    if (!ENABLE_AUTO_REDIRECT_IF_EXPIRED) return;
    if (authLoading || loadingProfile) return;
    if (!user) return;
    if (!isExpired) return;

    void handleCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, loadingProfile, user, isExpired]);

  async function handleCheckout() {
    try {
      setRedirecting(true);
      setError(null);

      // ⇩ remplace par ton endpoint (edge function / API route)
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerEmail: user?.email, userId: user?.id }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Échec de la création de la session de paiement");
      }
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error("URL de paiement manquante");
      window.location.href = url;
    } catch (e: any) {
      setRedirecting(false);
      setError(e?.message ?? "Erreur inconnue pendant la redirection Stripe");
    }
  }

  // ----- Rendu -----
  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Vérification de votre période d’essai…</div>
      </div>
    );
  }

  // (On ne redirige PAS vers /app ici pour éviter le ping-pong avec AuthenticatedApp)
  // L'utilisateur reste sur le Paywall tant que tu l'y envoies depuis AuthenticatedApp.

  const prettyDate = trialEndStr ? new Date(trialEndStr).toLocaleDateString() : "Non définie";
  const title = isExpired
    ? "Votre période d’essai est terminée"
    : isEndingToday
    ? "Votre période d’essai se termine aujourd’hui"
    : "Votre période d’essai est en cours";
  const description = isExpired
    ? "Pour continuer à utiliser l’application, passez au plan payant."
    : isEndingToday
    ? "Dernier jour d’essai — souscrivez maintenant pour éviter toute coupure."
    : "Profitez de votre essai et souscrivez pour ne rien perdre à l’échéance.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            {isExpired ? <AlertTriangle className="h-6 w-6" /> : <Info className="h-6 w-6" />}
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Date de fin d’essai : <strong className="ml-1">{prettyDate}</strong>
            </span>
          </div>

          {error && (
            <div className="text-sm text-destructive border border-destructive/40 rounded-md p-2">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="w-full sm:w-auto" onClick={handleCheckout} disabled={redirecting}>
              <CreditCard className="mr-2 h-4 w-4" />
              {redirecting ? "Redirection vers Stripe…" : isExpired ? "Passer au paiement" : "Souscrire maintenant"}
            </Button>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => navigate("/app")}
              disabled={redirecting}
            >
              Retour à l’accueil
            </Button>
          </div>

          {debugMode && (
            <p className="text-xs text-muted-foreground">
              Mode test actif (<code>debugTrial={debugMode}</code>). Retirez ce paramètre pour le comportement réel.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
