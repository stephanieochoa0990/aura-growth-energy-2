import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

function sha1Hex(password: string): string {
  const data = new TextEncoder().encode(password);
  const hashBuffer = crypto.subtle.digestSync("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { password } = await req.json();
    if (!password || typeof password !== "string") {
      return new Response(JSON.stringify({ error: "Missing password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔒 Generate SHA1 hash
    const sha1 = sha1Hex(password);
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    // 🌐 Query HaveIBeenPwned API
    const hibp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!hibp.ok) {
      return new Response(JSON.stringify({ error: "HIBP API error" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const text = await hibp.text();
    const lines = text.split("\n");
    const match = lines.find((line) => line.startsWith(suffix));
    const count = match ? parseInt(match.split(":")[1]) : 0;
    const leaked = count > 0;

    return new Response(JSON.stringify({ leaked, count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
