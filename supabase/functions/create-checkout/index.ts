import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");
    
    // Check Stripe key first
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY is not set");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");
    
    const requestBody = await req.json();
    const { tier } = requestBody;
    if (!tier) {
      logStep("ERROR: No tier provided", { requestBody });
      throw new Error("No tier provided");
    }
    logStep("Tier provided", { tier });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      logStep("ERROR: Authentication failed", { error: authError });
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) {
      logStep("ERROR: User not authenticated or email not available", { user });
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("Creating new customer");
    }

    // For now, only handle starter tier
    if (tier !== 'starter') {
      logStep("ERROR: Only starter tier is supported", { tier });
      throw new Error(`Seule l'offre starter est disponible pour le moment`);
    }

    // Get price from environment variable
    const starterPriceId = Deno.env.get("STRIPE_PRICE_STARTER");
    if (!starterPriceId) {
      logStep("ERROR: STRIPE_PRICE_STARTER is not set");
      throw new Error("STRIPE_PRICE_STARTER is not set");
    }
    
    logStep("Using Stripe price ID", { starterPriceId });

    logStep("Creating checkout session", { tier, priceId: starterPriceId });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: starterPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/offers?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/offers?checkout=cancel`,
      metadata: {
        user_id: user.id,
        tier: tier
      }
    });

    logStep("Checkout session created successfully", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage, stack: error instanceof Error ? error.stack : 'No stack' });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});