// src/pages/TrialPaywall.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOffers } from '@/hooks/useOffers';
import { Badge } from "@/components/ui/badge";
import { useCheckout } from "@/components/offers/useCheckout";

// ----- ENV -----
const PRICE_MONTHLY_STARTER = import.meta.env.VITE_STRIPE_PRICE_MONTHLY_STARTER as string;
const PRICE_MONTHLY_STANDARD = import.meta.env.VITE_STRIPE_PRICE_MONTHLY_STANDARD as string;
const PRICE_MONTHLY_PREMIUM = import.meta.env.VITE_STRIPE_PRICE_MONTHLY_PREMIUM as string;

function parseDateOnlyMs(d: string | null | undefined): number | null {
  if (!d) return null;
  try {
    const date = d.length <= 10 ? new Date(`${d}T00:00:00`) : new Date(d);
    if (isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  } catch {
    return null;
  }
}

export default function TrialPaywall() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { start, pending, errorMsg, setErrorMsg } = useCheckout();
  const { data: offers = [], isLoading: offersLoading } = useOffers();

  // ----------------- Auth / Contexte -----------------
  const { user, initialized, loading, profile, subscription } = useAuth();

  // 1) État "décidé" : on n’agit QUE quand tout est prêt
  //    Si `subscription` est `undefined` pendant le fetch, on attend.
  const authReady =
    initialized &&
    !loading &&
    user !== null &&
    // si ton hook met `null` quand pas d’abo, c’est ok ; on attend seulement l'undefined
    typeof subscription !== "undefined";

  // 2) Derivés
  const subAny = subscription as any;
  const subStatus: string = (subAny?.subscription_status ?? subAny?.status ?? "").toLowerCase();
  const isSubscribed = subStatus === "active" || subStatus === "trialing" || subStatus === "past_due";

  const trialEndMs = useMemo(() => parseDateOnlyMs((profile as any)?.trial_end_date ?? null), [profile]);
  const todayStartMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const trialValid = trialEndMs !== null && trialEndMs > todayStartMs;

  const mustPay = !isSubscribed && !trialValid;

  // 3) Sécuriser la navigation (une seule fois)
  const redirected = useRef(false);
  useEffect(() => {
    if (!authReady) return;
    // Si l’accès est autorisé, on quitte cette page (mais une seule fois)
    if (!mustPay && !redirected.current) {
      redirected.current = true;
    }
  }, [authReady, mustPay]);

  // 4) Handlers
  const handleSubscribe = async (offerId: string, priceId: string) => {
    if (!priceId) {
      setErrorMsg("Configuration Stripe manquante (priceId).");
      return;
    }
    setLoadingId(offerId);
    await start(priceId); // doit faire window.location.href = data.url en succès
    setLoadingId(null);
  };

  // ----------------- Early returns -----------------
  // Tant qu’on n’a pas décidé (user/sub state instable), on n’affiche rien → pas de Navigate
  if (!authReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  if (!mustPay) {
    // Accès autorisé → on ne rend rien ici, l'effet a déjà redirigé.
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
                  {trialText
                    ? `Ton essai gratuit se terminait le ${trialText}.`
                    : `Ton essai gratuit est terminé, ou aucune formule active n’a été trouvée sur ce compte.`}
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

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {(offersLoading ? [1, 2, 3] : offers).map((offer: any, idx: number) => {
            if (offersLoading) {
              return (
                <Card key={`skeleton-${idx}`} className="p-6">
                  <div className="animate-pulse h-6 w-32 bg-muted rounded mb-4" />
                  <div className="animate-pulse h-4 w-48 bg-muted rounded mb-2" />
                  <div className="animate-pulse h-8 w-24 bg-muted rounded my-6" />
                  <div className="animate-pulse h-10 w-full bg-muted rounded" />
                </Card>
              );
            }

            const isPopular = !!offer.popular;
            const priceId =
              offer.name === "Starter" ? PRICE_MONTHLY_STARTER :
                offer.name === "Standard" ? PRICE_MONTHLY_STANDARD :
                  offer.name === "Premium" ? PRICE_MONTHLY_PREMIUM :
                    PRICE_MONTHLY_STARTER;

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
                    <div className="text-muted-foreground text-lg">{offer.period ?? "/mois"}</div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-center text-sm text-muted-foreground">
                    {offer.max_properties}
                  </div>

                  <ul className="space-y-3">
                    {(offer.features ?? []).map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full text-lg py-6"
                    onClick={() => handleSubscribe(String(offer.id), priceId)}
                    disabled={loadingId === String(offer.id) || pending}
                    size="lg"
                  >
                    {loadingId === String(offer.id) || pending ? (
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
            <a href="mailto:contact@bailogenius.fr" className="text-primary hover:underline">
              contact@bailogenius.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
