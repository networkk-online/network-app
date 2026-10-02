import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/require-admin.ts";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

async function getFcmAccessToken(serviceAccount: ServiceAccount) {
  const key = await importPKCS8(serviceAccount.private_key, "RS256");
  return await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(serviceAccount.client_email)
    .setSubject(serviceAccount.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
}

async function exchangeJwtForAccessToken(jwt: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google OAuth token exchange failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const denied = await requireAdmin(req, corsHeaders);
  if (denied) return denied;

  try {
    const serviceAccountRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountRaw) {
      return new Response(
        JSON.stringify({
          error: "FCM is not configured",
          setup: "Add FIREBASE_SERVICE_ACCOUNT_JSON to Supabase Edge Function secrets",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceAccount = JSON.parse(serviceAccountRaw) as ServiceAccount;
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error("Invalid Firebase service account JSON");
    }

    const payload = await req.json();
    const title = String(payload.title ?? "").trim();
    const body = String(payload.body ?? "").trim();
    const route = String(payload.route ?? "/").trim() || "/";
    const variant = String(payload.variant ?? "info").trim() || "info";

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (title.length > 120 || body.length > 500) {
      return new Response(
        JSON.stringify({ error: "title/body exceed allowed length" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("id, token, platform")
      .eq("platform", "android");

    if (tokensError) throw tokensError;

    const accessToken = await exchangeJwtForAccessToken(await getFcmAccessToken(serviceAccount));
    const endpoint = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

    let sent = 0;
    let failed = 0;
    const invalidTokenIds: string[] = [];

    const sendOne = async (row: { id: string; token: string }) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: row.token,
            notification: { title, body },
            data: {
              route,
              type: "system_broadcast",
              variant,
            },
            android: {
              priority: "high",
              notification: {
                channel_id: "networkk_default",
                sound: "default",
              },
            },
          },
        }),
      });

      if (response.ok) {
        sent++;
        return;
      }

      failed++;
      const errorText = await response.text();
      if (
        errorText.includes("UNREGISTERED") ||
        errorText.includes("INVALID_ARGUMENT")
      ) {
        invalidTokenIds.push(row.id);
      }
    };

    // Keep concurrency bounded so a large user base does not overwhelm the Edge Function.
    const concurrency = 20;
    for (let i = 0; i < (tokens ?? []).length; i += concurrency) {
      const chunk = (tokens ?? []).slice(i, i + concurrency);
      await Promise.all(chunk.map(sendOne));
    }

    if (invalidTokenIds.length) {
      await supabase.from("push_tokens").delete().in("id", invalidTokenIds);
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error: broadcastError } = await supabase.from("system_broadcasts").insert({
      title,
      body,
      variant,
      created_by: user?.id ?? null,
    });

    if (broadcastError) throw broadcastError;

    return new Response(
      JSON.stringify({
        success: true,
        totalTokens: tokens?.length ?? 0,
        sent,
        failed,
        removedInvalidTokens: invalidTokenIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("send-broadcast-push error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
