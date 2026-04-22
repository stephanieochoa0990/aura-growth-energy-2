import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const appUrl = (Deno.env.get("APP_URL") ?? Deno.env.get("SITE_URL") ?? "http://localhost:5173").replace(/\/+$/, "");
const auraPriceId = Deno.env.get("STRIPE_AURA_EMPOWERMENT_PRICE_ID") ?? Deno.env.get("STRIPE_PRICE_ID_AURA_EMPOWERMENT");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIVE_COURSE_ID = "aura-empowerment";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    if (!stripeSecretKey) {
      return json({ error: "Stripe is not configured" }, 500);
    }

    if (!auraPriceId) {
      return json({ error: "Course price is not configured" }, 500);
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: "Supabase is not configured" }, 500);
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { course_id, user_id } = await req.json();

    if (course_id !== ACTIVE_COURSE_ID) {
      return json({ error: "Unsupported course_id" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: authUser, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser?.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    if (user_id !== authUser.user.id) {
      return json({ error: "User mismatch" }, 403);
    }

    const { data: existingEnrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", authUser.user.id)
      .eq("course_id", ACTIVE_COURSE_ID)
      .in("status", ["active", "trialing", "granted"])
      .maybeSingle();

    if (enrollmentError) {
      throw enrollmentError;
    }

    if (existingEnrollment) {
      return json({ url: `${appUrl}/student-welcome?already_enrolled=1` });
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${appUrl}/student-welcome?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${appUrl}/?checkout=cancelled`);
    params.set("client_reference_id", authUser.user.id);
    params.set("customer_email", authUser.user.email ?? "");
    params.set("line_items[0][price]", auraPriceId);
    params.set("line_items[0][quantity]", "1");
    params.set("metadata[course_id]", ACTIVE_COURSE_ID);
    params.set("metadata[supabase_user_id]", authUser.user.id);
    params.set("payment_intent_data[metadata][course_id]", ACTIVE_COURSE_ID);
    params.set("payment_intent_data[metadata][supabase_user_id]", authUser.user.id);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe checkout error:", session);
      return json({ error: session?.error?.message ?? "Could not create checkout session" }, 500);
    }

    return json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return json({ error: "Failed to create checkout session" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
