import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[DEBUG-STRIPE] Starting debug...");
    
    // Test Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("[DEBUG-STRIPE] Stripe key exists:", !!stripeKey);
    console.log("[DEBUG-STRIPE] Stripe key prefix:", stripeKey?.substring(0, 12));
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not found");
    }
    
    // Test Stripe initialization
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    console.log("[DEBUG-STRIPE] Stripe instance created");
    
    // Test a simple Stripe API call
    try {
      const balance = await stripe.balance.retrieve();
      console.log("[DEBUG-STRIPE] Stripe API test successful:", { 
        available: balance.available,
        pending: balance.pending 
      });
    } catch (stripeError) {
      console.error("[DEBUG-STRIPE] Stripe API test failed:", stripeError.message);
      return new Response(JSON.stringify({ 
        error: "Stripe API test failed", 
        details: stripeError.message,
        stripe_configured: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    // Test Supabase auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError) {
        console.error("[DEBUG-STRIPE] Auth test failed:", authError.message);
        return new Response(JSON.stringify({ 
          error: "Auth test failed", 
          details: authError.message 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
      
      console.log("[DEBUG-STRIPE] Auth test successful:", { 
        userId: data.user?.id, 
        email: data.user?.email 
      });
    }
    
    return new Response(JSON.stringify({
      status: "success",
      message: "All tests passed",
      stripe_configured: true,
      stripe_api_working: true,
      auth_working: !!authHeader
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("[DEBUG-STRIPE] Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});