import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@16.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ step: "env", error: "Missing env vars" }), { status: 500, headers: cors });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const { userId, email, returnUrl } = body as { userId?: string; email?: string; returnUrl?: string };
    if (!userId || !returnUrl) {
      return new Response(JSON.stringify({ step: "validate", error: "Missing fields (userId, returnUrl)" }), {
        status: 400, headers: cors,
      });
    }

    // 1) Lire customer existant
    const { data: existing, error: qerr } = await sb
      .from("subscriptions")
      .select("id, stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (qerr) {
      return new Response(JSON.stringify({ step: "db-select", error: qerr.message }), {
        status: 400, headers: cors,
      });
    }

    // 2) Créer customer si besoin
    let customerId = existing?.stripe_customer_id as string | null;
    if (!customerId) {
      try {
        const created = await stripe.customers.create({ email: email || undefined });
        customerId = created.id;
      } catch (e: any) {
        return new Response(JSON.stringify({ step: "stripe-create-customer", error: e?.message ?? String(e) }), {
          status: 400, headers: cors,
        });
      }

      if (existing?.id) {
        const { error: updErr } = await sb
          .from("subscriptions")
          .update({ stripe_customer_id: customerId })
          .eq("id", existing.id);
        if (updErr) {
          return new Response(JSON.stringify({ step: "db-update", error: updErr.message }), {
            status: 400, headers: cors,
          });
        }
      } else {
        const { error: insErr } = await sb.from("subscriptions").insert({
          user_id: userId,
          stripe_customer_id: customerId,
          subscribed: false,
          subscription_status: "created",
        });
        if (insErr) {
          return new Response(JSON.stringify({ step: "db-insert", error: insErr.message }), {
            status: 400, headers: cors,
          });
        }
      }
    }

    // 3) Créer la session du portail
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId!,
        return_url: returnUrl,
      });
      return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: cors });
    } catch (e: any) {
      return new Response(JSON.stringify({ step: "stripe-portal", error: e?.message ?? String(e) }), {
        status: 400, headers: cors,
      });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ step: "catch", error: e?.message ?? String(e) }), {
      status: 400, headers: cors,
    });
  }
});
