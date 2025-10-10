import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type StripeUrlResponse = { url: string };

export function useCheckout() {
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const start = async (priceId: string) => {
    setPending(true);
    setErrorMsg(null);
    try {
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      const { data, error } = await supabase.functions.invoke<StripeUrlResponse>(
        "create-checkout-session",
        {
          body: {
            priceId,
            returnUrl: `${window.location.origin}/app`,
            userId: user.id,
            email: user.email,
          },
        }
      );

      if (error) throw error;
      if (!data?.url) {
        setErrorMsg("Réponse inattendue: URL de checkout absente.");
        return;
      }
      window.location.href = data.url;
    } catch (err: any) {
      console.error("[Checkout] error:", err);
      setErrorMsg(err?.message ?? "Impossible de démarrer le paiement.");
    } finally {
      setPending(false);
    }
  };

  return { start, pending, errorMsg, setErrorMsg };
}
