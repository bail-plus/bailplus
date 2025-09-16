// deno-lint-ignore-file no-explicit-any
import Stripe from "npm:stripe";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

/** ======== ENV ======== **/
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!STRIPE_SECRET_KEY) console.error("Missing STRIPE_SECRET_KEY");
if (!STRIPE_WEBHOOK_SECRET) console.error("Missing STRIPE_WEBHOOK_SECRET");
if (!SUPABASE_URL) console.error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) console.error("Missing SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** ======== UTILS ======== **/
const cors = (res: Response) => {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Headers", "stripe-signature, content-type");
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return new Response(res.body, { ...res, headers: h });
};

const toIso = (unix?: number | null) =>
  typeof unix === "number" ? new Date(unix * 1000).toISOString() : null;

const isSubscribedStatus = (status?: string | null) => {
  const s = (status ?? "").toLowerCase();
  return s === "active" || s === "trialing" || s === "past_due";
};

async function findUserId({
  userId,
  customerId,
  email,
}: {
  userId?: string | null;
  customerId?: string | null;
  email?: string | null;
}): Promise<string | null> {
  if (userId) return userId;

  // 1) profile via customer_id
  if (customerId) {
    const { data } = await supabase
      .from("profile")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .limit(1)
      .maybeSingle();
    if (data?.user_id) return data.user_id as string;
  }

  // 2) profile via email
  if (email) {
    const { data } = await supabase
      .from("profile")
      .select("user_id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (data?.user_id) return data.user_id as string;
  }

  return null;
}

async function upsertSubscriptionRow(args: {
  user_id: string | null;
  email: string | null | undefined;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null | undefined;
  current_period_start: number | null | undefined;
  current_period_end: number | null | undefined;
  trial_end: number | null | undefined;
}) {
  const row = {
    user_id: args.user_id,
    email: args.email ?? null,
    stripe_customer_id: args.stripe_customer_id ?? null,
    stripe_subscription_id: args.stripe_subscription_id ?? null,
    subscribed: isSubscribedStatus(args.status),
    subscription_status: args.status ?? null,
    subscription_start: toIso(args.current_period_start),
    subscription_end: toIso(args.current_period_end),
    trial_end: toIso(args.trial_end),
    updated_at: new Date().toISOString(),
  };

  // essaie de retrouver une ligne existante
  let existing: any = null;

  if (args.user_id) {
    const { data } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", args.user_id)
      .limit(1)
      .maybeSingle();
    existing = data;
  }

  if (!existing && args.stripe_subscription_id) {
    const { data } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", args.stripe_subscription_id)
      .limit(1)
      .maybeSingle();
    existing = data;
  }

  if (!existing && args.stripe_customer_id) {
    const { data } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_customer_id", args.stripe_customer_id)
      .limit(1)
      .maybeSingle();
    existing = data;
  }

  if (existing?.id) {
    await supabase.from("subscriptions").update(row).eq("id", existing.id);
  } else {
    await supabase.from("subscriptions").insert({
      ...row,
      created_at: new Date().toISOString(),
    });
  }
}

async function updateProfileRoleAndStripe(args: {
  user_id: string | null;
  email?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  status?: string | null;
  period_end?: number | null;
}) {
  if (!args.user_id && !args.email && !args.stripe_customer_id) return;

  // calcule le role cible (ne touche pas aux admins)
  const wantUser = isSubscribedStatus(args.status);
  const patch: Record<string, any> = {
    stripe_customer_id: args.stripe_customer_id ?? null,
    stripe_subscription_id: args.stripe_subscription_id ?? null,
    subscription_status: args.status ?? null,
    current_period_end: toIso(args.period_end),
    updated_at: new Date().toISOString(),
  };

  // on récupère le role actuel pour éviter de downgrader un admin
  let filter = supabase.from("profile").select("id, role");
  if (args.user_id) filter = filter.eq("user_id", args.user_id);
  else if (args.email) filter = filter.eq("email", args.email);
  else if (args.stripe_customer_id) filter = filter.eq("stripe_customer_id", args.stripe_customer_id);

  const { data: prof } = await filter.limit(1).maybeSingle();

  if (prof) {
    const isAdmin = (prof.role ?? "").toLowerCase() === "admin";
    if (!isAdmin) patch.role = wantUser ? "user" : "trial";
    await supabase.from("profile").update(patch).eq("id", prof.id);
  } else if (args.user_id) {
    // fallback: si on n'a pas trouvé via les filtres au-dessus
    await supabase
      .from("profile")
      .update(patch)
      .eq("user_id", args.user_id);
  }
}

/** ======== HANDLER ======== **/
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
  if (req.method !== "POST") return cors(new Response("Method Not Allowed", { status: 405 }));

  const signature = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscriptionId = (session.subscription as string) ?? null;
        const customerId = (session.customer as string) ?? null;
        const email = session.customer_details?.email ?? (session.metadata?.email as string | undefined) ?? null;
        const metaUserId = (session.metadata?.user_id as string | undefined) ?? null;

        // Enrichir via l'API
        let sub: Stripe.Subscription | null = null;
        if (subscriptionId) sub = await stripe.subscriptions.retrieve(subscriptionId);

        const userId = await findUserId({
          userId: metaUserId,
          customerId,
          email,
        });

        await upsertSubscriptionRow({
          user_id: userId,
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: sub?.status ?? "active", // fallback
          current_period_start: sub?.current_period_start ?? null,
          current_period_end: sub?.current_period_end ?? null,
          trial_end: sub?.trial_end ?? null,
        });

        await updateProfileRoleAndStripe({
          user_id: userId,
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: sub?.status ?? "active",
          period_end: sub?.current_period_end ?? null,
        });

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status;
        const subscriptionId = sub.id;
        const customerId = sub.customer as string;
        const email = (sub as any).customer_email ?? null; // rare, mais autant tenter
        const metaUserId = (sub.metadata?.user_id as string | undefined) ?? null;

        const userId = await findUserId({
          userId: metaUserId,
          customerId,
          email,
        });

        await upsertSubscriptionRow({
          user_id: userId,
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          trial_end: sub.trial_end,
        });

        await updateProfileRoleAndStripe({
          user_id: userId,
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status,
          period_end: sub.current_period_end,
        });

        break;
      }

      default:
        // autres événements ignorés
        break;
    }

    return cors(new Response(JSON.stringify({ received: true }), { status: 200 }));
  } catch (err: any) {
    console.error("stripe-webhook error:", err?.message ?? err);
    return cors(new Response(JSON.stringify({ error: err?.message ?? "Invalid payload" }), { status: 400 }));
  }
});
