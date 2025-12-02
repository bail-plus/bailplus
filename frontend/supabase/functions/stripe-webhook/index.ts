// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@16.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ok = (b = "ok") => new Response(b, { status: 200 });
const bad = (m = "bad request") => new Response(m, { status: 400 });

const tierFromPriceId = (priceId: string) => {
  const STARTER = Deno.env.get("STRIPE_PRICE_STARTER");
  const STANDARD = Deno.env.get("STRIPE_PRICE_STANDARD");
  const PREMIUM = Deno.env.get("STRIPE_PRICE_PREMIUM");
  if (priceId === STARTER) return "STARTER";
  if (priceId === STANDARD) return "STANDARD";
  if (priceId === PREMIUM) return "PREMIUM";
  return "UNKNOWN";
};

const isSubscribed = (status: string) =>
  ["active", "trialing", "past_due"].includes(status);

serve(async (req) => {
  if (req.method === "OPTIONS") return ok();

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing env");
    return bad("Missing env");
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ⚠️ RAW BODY + constructEventAsync
  const signature = req.headers.get("stripe-signature");
  if (!signature) return bad("No signature");
  const raw = await req.text(); // ou: const raw = new Uint8Array(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Signature verification failed:", e);
    return bad("Bad signature");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = (s.client_reference_id || s.metadata?.user_id) as string | undefined;
        const customerId = (s.customer as string) || undefined;
        if (userId && customerId) {
          await supabase.from("subscriptions").upsert(
            { user_id: userId, stripe_customer_id: customerId },
            { onConflict: "user_id" }
          );
        }
        if (s.subscription && userId) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          const priceId = sub.items.data[0]?.price?.id || (s.metadata?.price_id as string) || "";
          const status = sub.status;
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            subscription_status: status,
            subscription_tier: tierFromPriceId(priceId),
            subscription_start: new Date(sub.current_period_start * 1000).toISOString(),
            subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
            subscribed: isSubscribed(status),
          }, { onConflict: "user_id" });
          if (isSubscribed(status)) {
            await supabase.from("profiles").update({ role: "user" }).eq("id", userId);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price?.id || "";
        const status = sub.status;
        const customerId = sub.customer as string;

        const { data: row } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        const userId = row?.user_id as string | undefined;
        if (!userId) break;

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          subscription_status: status,
          subscription_tier: tierFromPriceId(priceId),
          subscription_start: new Date(sub.current_period_start * 1000).toISOString(),
          subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
          subscribed: isSubscribed(status),
        }, { onConflict: "user_id" });

        await supabase
          .from("profiles")
          .update({ role: isSubscribed(status) ? "user" : "trial" })
          .eq("id", userId);

        break;
      }
      default:
        // autres events non critiques
        break;
    }

    return ok();
  } catch (e) {
    console.error("[stripe-webhook] handler error:", e);
    return bad("hook error");
  }
});
