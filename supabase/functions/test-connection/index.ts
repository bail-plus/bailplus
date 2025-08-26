import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[TEST-CONNECTION] Function started successfully");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("[TEST-CONNECTION] Stripe key exists:", !!stripeKey);
    console.log("[TEST-CONNECTION] Stripe key prefix:", stripeKey?.substring(0, 7));
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    console.log("[TEST-CONNECTION] Supabase URL exists:", !!supabaseUrl);
    
    return new Response(JSON.stringify({
      status: "success",
      message: "Edge function is working",
      stripe_key_configured: !!stripeKey,
      stripe_key_prefix: stripeKey?.substring(0, 7),
      supabase_url_configured: !!supabaseUrl
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[TEST-CONNECTION] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});