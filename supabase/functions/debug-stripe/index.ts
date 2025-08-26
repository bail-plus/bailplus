import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEBUG-STRIPE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("=== DEBUG STRIPE FUNCTION STARTED ===");
    
    // Check all environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const priceId = Deno.env.get("STRIPE_PRICE_STARTER");
    
    logStep("Environment check", {
      hasStripeKey: !!stripeKey,
      stripeKeyLength: stripeKey?.length || 0,
      stripeKeyPrefix: stripeKey?.substring(0, 10) || "NONE",
      hasPriceId: !!priceId,
      priceId: priceId || "NONE"
    });
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is missing");
    }
    
    if (!priceId) {
      throw new Error("STRIPE_PRICE_STARTER is missing");
    }
    
    // Test Stripe initialization
    logStep("Testing Stripe initialization");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Test Stripe API connection by fetching the price
    logStep("Testing Stripe API connection - fetching price", { priceId });
    try {
      const price = await stripe.prices.retrieve(priceId);
      logStep("Price retrieved successfully", { 
        id: price.id, 
        amount: price.unit_amount, 
        currency: price.currency,
        active: price.active
      });
    } catch (priceError) {
      logStep("ERROR fetching price", { 
        priceId,
        error: priceError instanceof Error ? priceError.message : String(priceError)
      });
      throw new Error(`Invalid price ID: ${priceId} - ${priceError instanceof Error ? priceError.message : String(priceError)}`);
    }
    
    // Test auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      throw new Error("No authorization header provided");
    }

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
    logStep("User authenticated successfully", { userId: user.id, email: user.email });
    
    logStep("=== ALL TESTS PASSED ===");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "All Stripe and auth tests passed",
      stripeKeyValid: true,
      priceIdValid: true,
      userAuthenticated: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("=== ERROR IN DEBUG ===", { message: errorMessage, stack: error instanceof Error ? error.stack : 'No stack' });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});