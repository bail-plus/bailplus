// src/pages/TrialPaywall.tsx
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useOffers } from '@/hooks/useOffers';
import { Badge } from "@/components/ui/badge";
import { useCheckout } from "@/components/offers/useCheckout";
// ----- ENV -----
const PRICE_MONTHLY_STARTER = import.meta.env.VITE_STRIPE_PRICE_MONTHLY_STARTER as string;
const PRICE_MONTHLY_STANDARD = import.meta.env.VITE_STRIPE_PRICE_MONTHLY_STANDARD as string;
const PRICE_MONTHLY_PREMIUM = import.meta.env.VITE_STRIPE_PRICE_MONTHLY_PREMIUM as string;

// Utilitaire: parse une date 'YYYY-MM-DD' ou ISO en ms (début de journée locale)
function parseDateOnlyMs(d: string | null | undefined): number | null {
  if (!d) return null;
  try {
    // Support à la fois 'YYYY-MM-DD' et ISO string
    const date = d.length <= 10 ? new Date(`${d}T00:00:00`) : new Date(d);
    if (isNaN(date.getTime())) return null;
    // début de journée
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  } catch {
    return null;
  }
}
export default function TrialPaywall() {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { start, pending, errorMsg, setErrorMsg } = useCheckout();
  const { data: offers = [], isLoading, error } = useOffers();
  console.log("Offers from useOffers:", offers, isLoading, error);
  // ----------------- Auth / Contexte -----------------
  const { user, initialized, loading, profile, subscription } = useAuth();

  const handleSubscribe = async (offerId: string, priceId: string) => {
    setLoadingId(offerId);
    await start(priceId);
    setLoadingId(null);
  };

  // ----------------- Dérivés / Mémos -----------------
  // Normalisation du statut d’abonnement (certains schémas => subscription_status, d’autres => status)
  const subAny = subscription as any;
  const subStatus: string = (subAny?.subscription_status ?? subAny?.status ?? "").toLowerCase();
  const isSubscribed = subStatus === "active" || subStatus === "trialing" || subStatus === "past_due";

  // Fin d’essai : profile.trial_end_date (string ou null)
  const trialEndMs = useMemo(() => parseDateOnlyMs((profile as any)?.trial_end_date ?? null), [profile]);
  const todayStartMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const trialValid = trialEndMs !== null && trialEndMs > todayStartMs;

  // Décision d’accès: si pas abonné ET pas d’essai valide => paywall
  const mustPay = !isSubscribed && !trialValid;

  // ----------------- Effets (ORDRE AVANT LES RETURNS !) -----------------
  // Si on est déjà autorisé (abonné ou essai valide), on n’a rien à faire ici → go /app
  useEffect(() => {
    if (initialized && !loading && user && !mustPay) {
      navigate("/app", { replace: true });
    }
  }, [initialized, loading, user, mustPay, navigate]);
  if (!user) {
    // Pas connecté → login
    return <Navigate to="/login" replace />;
  }
  // ----------------- Early-returns APRÈS les hooks -----------------
  if (!initialized) {
    // Pendant l’hydratation initiale uniquement — pas sur les chargements de fond
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  if (!mustPay) {
    // Accès autorisé (abonné ou essai encore valide) → rien à voir sur cette page
    return null;
  }

  // ----------------- UI -----------------
  const trialText = trialEndMs
    ? new Date(trialEndMs).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gradient-surface py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Abonnez-vous à BailloGenius
          </h1>
          <div className="mx-auto max-w-2xl p-6">
            <Card className="border-emerald-700/20 bg-emerald-700/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-emerald-700" />
                  <CardTitle className="text-emerald-900">Accès restreint</CardTitle>
                </div>
                <CardDescription>
                  Ton essai gratuit est terminé, ou aucune formule active n’a été trouvée sur ce compte.
                </CardDescription>
              </CardHeader>
            </Card>

            {errorMsg && (
              <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choisissez l’offre qui correspond à votre gestion locative
          </p>
        </div>

        {/* 👉 ici seulement on map les offres */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {offers.map((offer) => {
            const isPopular = !!offer.popular;
            const priceId =
              offer.name === "Starter"
                ? PRICE_MONTHLY_STARTER
                : offer.name === "Standard"
                  ? PRICE_MONTHLY_STANDARD
                  : offer.name === "Premium"
                    ? PRICE_MONTHLY_PREMIUM
                    : PRICE_MONTHLY_STARTER;

            return (
              <Card
                key={offer.id}
                className={[
                  "relative p-6 transition-all duration-200 hover:shadow-lg",
                  isPopular ? "ring-2 ring-primary shadow-lg" : "border",
                ].join(" ")}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Offre recommandée
                  </Badge>
                )}

                <CardHeader className="pb-6 text-center">
                  <CardTitle className="text-3xl">{offer.name}</CardTitle>
                  <CardDescription className="text-base">{offer.description}</CardDescription>
                  <div className="pt-4">
                    <div className="text-5xl font-bold text-foreground">{offer.price}</div>
                    <div className="text-muted-foreground text-lg">
                      {offer.period ?? "/mois"}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-center text-sm text-muted-foreground">
                    {offer.max_properties}
                  </div>

                  <ul className="space-y-3">
                    {(offer.features ?? []).map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full text-lg py-6"
                    onClick={() => handleSubscribe(String(offer.id), priceId)}
                    disabled={loadingId === String(offer.id)}
                    size="lg"
                  >
                    {loadingId === String(offer.id) ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redirection vers Stripe...
                      </>
                    ) : (
                      <>
                        S&apos;abonner maintenant
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            Paiement sécurisé par Stripe • Annulation possible à tout moment
          </p>
          <p className="text-sm text-muted-foreground">
            Questions ? Contactez-nous à{" "}
            <a
              href="mailto:contact@bailogenius.fr"
              className="text-primary hover:underline"
            >
              contact@bailogenius.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}