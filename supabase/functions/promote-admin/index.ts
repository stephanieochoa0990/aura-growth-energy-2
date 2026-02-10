import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    const { setupToken } = await req.json();

    if (!setupToken || typeof setupToken !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing setup token" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined,
      auth: { persistSession: false },
    });

    // Resolve the authenticated user
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const userId = authUser.user.id;

    // Verify token exists and is unused
    const { data: tokenData, error: tokenError } = await supabase
      .from("setup_tokens")
      .select("*")
      .eq("token", setupToken)
      .eq("used", false)
      .maybeSingle();

    if (tokenError) {
      throw tokenError;
    }
    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or already used setup token" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Mark token as used
    const { error: updateTokenError } = await supabase
      .from("setup_tokens")
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq("id", tokenData.id);

    if (updateTokenError) {
      throw updateTokenError;
    }

    // Set user as admin
    const { error: adminError } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", userId);

    if (adminError) {
      throw adminError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("promote-admin error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to promote admin" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

