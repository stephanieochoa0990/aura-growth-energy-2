import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const ACTIVE_COURSE_ID = "aura-empowerment";
const SIGNATURE_TOLERANCE_SECONDS = 300;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    if (!stripeWebhookSecret) {
      return json({ error: "Stripe webhook is not configured" }, 500);
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase is not configured" }, 500);
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return json({ error: "Missing Stripe signature" }, 400);
    }

    const rawBody = await req.text();
    const verified = await verifyStripeSignature(rawBody, signature, stripeWebhookSecret);
    if (!verified) {
      return json({ error: "Invalid Stripe signature" }, 400);
    }

    const event = JSON.parse(rawBody);

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const userId = session?.metadata?.supabase_user_id ?? session?.client_reference_id;
      const courseId = session?.metadata?.course_id ?? ACTIVE_COURSE_ID;

      if (!userId || courseId !== ACTIVE_COURSE_ID) {
        return json({ received: true, skipped: true });
      }

      if (session?.mode !== "payment" || session?.payment_status !== "paid") {
        console.warn("Skipping checkout session without completed payment", {
          id: session?.id,
          mode: session?.mode,
          payment_status: session?.payment_status,
        });
        return json({ received: true, skipped: true });
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      const { error } = await supabase
        .from("enrollments")
        .upsert(
          {
            user_id: userId,
            course_id: ACTIVE_COURSE_ID,
            status: "active",
            source: "stripe",
            access_expires_at: null,
            metadata: {
              stripe_checkout_session_id: session.id,
              stripe_customer_id: session.customer ?? null,
              stripe_payment_intent_id: session.payment_intent ?? null,
              amount_total: session.amount_total ?? null,
              currency: session.currency ?? null,
              paid_at: new Date().toISOString(),
            },
          },
          { onConflict: "user_id,course_id" },
        );

      if (error) {
        throw error;
      }
    }

    return json({ received: true });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return json({ error: "Webhook handling failed" }, 500);
  }
});

async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  const parts = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return acc;
    acc[key] = [...(acc[key] ?? []), value];
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];
  if (!timestamp || signatures.length === 0) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (ageSeconds > SIGNATURE_TOLERANCE_SECONDS) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return signatures.some((candidate) => timingSafeEqual(candidate, expected));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
