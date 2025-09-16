// supabase/functions/create-checkout-session/index.ts
// Crée une session Stripe Checkout (abonnement) et renvoie { url }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.5.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    console.log("[Edge] OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[Edge] Incoming request:", req.method);

    if (req.method !== "POST") {
      console.log("[Edge] Method not allowed");
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("[Edge] STRIPE_SECRET_KEY present:", !!STRIPE_SECRET_KEY);

    if (!STRIPE_SECRET_KEY) {
      console.log("[Edge] STRIPE_SECRET_KEY is not set");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.json();
    console.log("[Edge] Request body:", body);

    const { priceId, userId, email, returnUrl } = body;

    if (!priceId) {
      console.log("[Edge] Missing priceId");
      throw new Error("Missing priceId");
    }
    if (!returnUrl) {
      console.log("[Edge] Missing returnUrl");
      throw new Error("Missing returnUrl");
    }

    console.log("[Edge] Creating Stripe session with:", {
      priceId,
      userId,
      email,
      returnUrl,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email ?? undefined,
      allow_promotion_codes: true,
      success_url: `${returnUrl}?checkout=success`,
      cancel_url: `${returnUrl}?checkout=cancel`,
      metadata: userId ? { user_id: userId } : undefined,
    });

    console.log("[Edge] Stripe session created:", session);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Edge] create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error)?.message ?? "Unknown error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
