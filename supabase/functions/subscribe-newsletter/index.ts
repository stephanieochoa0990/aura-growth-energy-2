import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { email, firstName } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ success: false, message: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // Upsert subscriber by email
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email,
          first_name: firstName ?? null,
          is_active: true,
        },
        { onConflict: "email" },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    const message =
      "You're in! Check your inbox for a welcome email and future updates.";

    const responseBody = {
      success: true,
      reactivated: !!data?.reactivated,
      alreadySubscribed: false,
      message,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("subscribe-newsletter error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to subscribe to newsletter.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

