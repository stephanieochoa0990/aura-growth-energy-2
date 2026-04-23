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
    console.error("create-checkout-session rejected non-POST request", {
      method: req.method,
    });
    return json({ error: "Method Not Allowed" }, 405);
  }

  try {
    let requestBody: { course_id?: string; user_id?: string } | null = null;

    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("create-checkout-session invalid JSON body", {
        error,
      });
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { course_id, user_id } = requestBody;

    console.error("create-checkout-session incoming request", {
      body: requestBody,
      course_id,
      user_id,
      hasStripeSecretKey: Boolean(stripeSecretKey),
      hasAuraPriceId: Boolean(auraPriceId),
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    });

    if (!stripeSecretKey) {
      console.error("create-checkout-session missing STRIPE_SECRET_KEY", {
        course_id,
        user_id,
        hasStripeSecretKey: false,
      });
      return json({ error: "Stripe is not configured" }, 500);
    }

    if (!auraPriceId) {
      console.error("create-checkout-session missing STRIPE_AURA_EMPOWERMENT_PRICE_ID", {
        course_id,
        user_id,
        hasAuraPriceId: false,
      });
      return json({ error: "Course price is not configured" }, 500);
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("create-checkout-session missing Supabase configuration", {
        course_id,
        user_id,
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasSupabaseAnonKey: Boolean(supabaseAnonKey),
      });
      return json({ error: "Supabase is not configured" }, 500);
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.error("create-checkout-session missing authorization token", {
        course_id,
        user_id,
        hasAuthHeader: Boolean(authHeader),
      });
      return json({ error: "Unauthorized" }, 401);
    }

    if (course_id !== ACTIVE_COURSE_ID) {
      console.error("create-checkout-session unsupported course_id", {
        course_id,
        user_id,
        expectedCourseId: ACTIVE_COURSE_ID,
      });
      return json({ error: "Unsupported course_id" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: authUser, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser?.user) {
      console.error("create-checkout-session auth lookup failed", {
        course_id,
        user_id,
        authUserFound: Boolean(authUser?.user),
        authError: authError?.message,
      });
      return json({ error: "Unauthorized" }, 401);
    }

    if (user_id !== authUser.user.id) {
      console.error("create-checkout-session user mismatch", {
        course_id,
        user_id,
        authUserId: authUser.user.id,
      });
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

    console.error("create-checkout-session preparing Stripe request", {
      course_id,
      user_id,
      authUserFound: true,
      stripeInitializationSuccess: true,
      hasStripeSecretKey: Boolean(stripeSecretKey),
      hasAuraPriceId: Boolean(auraPriceId),
    });

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
  } catch (error) {
    console.error("Stripe error:", error);
    console.error("create-checkout-session error:", error);
    return json({ error: error instanceof Error ? error.message : "Failed to create checkout session" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
