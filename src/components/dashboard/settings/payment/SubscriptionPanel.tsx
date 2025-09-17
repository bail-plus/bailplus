import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type SubRow = {
    id: string;
    user_id: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscribed: boolean; // NOT NULL
    subscription_tier: string | null;
    subscription_status: string | null; // "active" | "trialing" | "past_due" | "canceled" | ...
    subscription_start: string | null;  // timestamptz
    subscription_end: string | null;    // timestamptz
    created_at: string;
    updated_at: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Option: tes priceId Stripe (ou passe-les en props)
const PRICE_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_MONTHLY_STANDARD as string;

function fmt(dt: string | null) {
    if (!dt) return "—";
    try {
        return new Date(dt).toLocaleString();
    } catch {
        return dt;
    }
}

function StatusBadge({ status }: { status: string | null }) {
    const s = (status ?? "").toLowerCase();
    if (s === "active") return <Badge className="bg-emerald-600">Active</Badge>;
    if (s === "trialing") return <Badge className="bg-blue-600">Essai</Badge>;
    if (s === "past_due") return <Badge variant="destructive">Paiement en retard</Badge>;
    if (s === "canceled") return <Badge variant="outline">Annulée</Badge>;
    return <Badge variant="outline">Inconnue</Badge>;
}

export default function SubscriptionPanel() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [sub, setSub] = useState<SubRow | null>(null);
    const [busy, setBusy] = useState<"portal" | "checkout" | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isSubscribed = useMemo(() => {
        const st = (sub?.subscription_status ?? "").toLowerCase();
        return st === "active" || st === "trialing" || st === "past_due";
    }, [sub]);

    useEffect(() => {
        let alive = true;
        (async () => {
            if (!user) { setLoading(false); return; }
            setLoading(true);
            setError(null);

            // Lis la dernière ligne d’abonnement de l’utilisateur
            const { data, error } = await supabase
                .from("subscriptions")
                .select("*")
                .eq("user_id", user.id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle<SubRow>();

            if (!alive) return;

            if (error) {
                setError(error.message);
            } else {
                setSub(data ?? null);
            }
            setLoading(false);
        })();
        return () => { alive = false; };
    }, [user?.id]);

   const openBillingPortal = async () => {
  try {
    setBusy("portal");
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non connecté");

    const returnUrl = `${window.location.origin}/app/settings`;

    const res = await supabase.functions.invoke("create-billing-portal", {
      body: { userId: user.id, email: user.email ?? undefined, returnUrl },
    });

    if (res.error) {
      // Tente de décoder le JSON renvoyé (il contient { step, error })
      let msg = res.error.message;
      try {
        const parsed = JSON.parse(msg);
        msg = parsed.error ? `[${parsed.step}] ${parsed.error}` : msg;
      } catch {
        // Certaines versions mettent l'objet dans error.context
        const ctx = (res as any).error?.context;
        if (ctx?.error && ctx?.step) msg = `[${ctx.step}] ${ctx.error}`;
      }
      setError(msg);
      console.error("[portal] error:", res.error);
      return;
    }

    const url = (res.data as { url: string }).url;
    if (!url) throw new Error("Aucune URL de portail renvoyée.");
    window.location.href = url;
  } catch (e: any) {
    setError(e.message ?? "Erreur ouverture portail");
  } finally {
    setBusy(null);
  }
};



    const startCheckout = async () => {
        try {
            setBusy("checkout");
            setError(null);
            if (!PRICE_MONTHLY) throw new Error("PRICE_MONTHLY manquant (env).");

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Non connecté");

            // ta function prend un seul returnUrl (elle fabrique success/cancel en query)
            const returnUrl = `${window.location.origin}/app`;

            const { data, error } = await supabase.functions.invoke("create-checkout-session", {
                body: {
                    priceId: PRICE_MONTHLY,
                    userId: user.id,
                    email: user.email ?? undefined,
                    returnUrl
                },
            });

            if (error) throw error;
            const url = (data as { url: string }).url;
            if (!url) throw new Error("Aucune URL de paiement renvoyée.");
            window.location.href = url;
        } catch (e: any) {
            setError(e.message ?? "Erreur création de session Stripe");
        } finally {
            setBusy(null);
        }
    };



    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Abonnement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement de votre abonnement…
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <div>
                                <div className="font-medium text-sm">Statut</div>
                                <div className="text-xs text-muted-foreground">
                                    {sub?.subscription_tier ?? "—"} {sub?.stripe_subscription_id ? `· ${sub?.stripe_subscription_id}` : ""}
                                </div>
                            </div>
                            <StatusBadge status={sub?.subscription_status ?? null} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="p-3 bg-muted/20 rounded-lg">
                                <div className="font-medium text-sm">Début d’abonnement</div>
                                <div className="text-xs text-muted-foreground">{fmt(sub?.subscription_start)}</div>
                            </div>
                            <div className="p-3 bg-muted/20 rounded-lg">
                                <div className="font-medium text-sm">Fin / Annulation</div>
                                <div className="text-xs text-muted-foreground">{fmt(sub?.subscription_end)}</div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded p-3">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {isSubscribed ? (
                                <>
                                    <Button onClick={openBillingPortal} disabled={busy !== null}>
                                        {busy === "portal" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Gérer mon abonnement
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={startCheckout} disabled={busy !== null}>
                                    {busy === "checkout" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    S’abonner
                                </Button>
                            )}
                        </div>

                        {/* Historique simple basé sur created_at / updated_at */}
                        <div className="pt-4">
                            <div className="text-xs text-muted-foreground">Dernière mise à jour : {fmt(sub?.updated_at ?? null)}</div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
