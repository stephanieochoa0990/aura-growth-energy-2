import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    const { userId: bodyUserId, classId, reviewData } = await req.json();

    if (!classId || !reviewData) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { rating, title, content } = reviewData;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined,
      auth: { persistSession: false },
    });

    // Resolve the authenticated user from the token
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const effectiveUserId = authUser.user.id;

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        user_id: effectiveUserId,
        class_id: classId,
        rating,
        title,
        content,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ review }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-review error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to submit review" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

