import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RtcTokenBuilder, RtcRole } from "npm:agora-token@2.0.5";
import { requireUser } from "../_shared/require-user.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Require authenticated user
  const auth = await requireUser(req, corsHeaders);
  if ('response' in auth) return auth.response;

  try {
    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!appId) {
      return new Response(
        JSON.stringify({ ok: false, error: "AGORA_APP_ID not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { channelName, uid = 0, role = 1 } = body || {};

    if (!channelName || typeof channelName !== "string" || channelName.length > 128) {
      return new Response(
        JSON.stringify({ ok: false, error: "channelName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let token: string | null = null;

    if (appCertificate && appCertificate.trim().length > 0) {
      const expireSeconds = 3600 * 4;
      const currentTs = Math.floor(Date.now() / 1000);
      const privilegeExpireTs = currentTs + expireSeconds;
      const rtcRole = role === 2 ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

      token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        Number(uid) || 0,
        rtcRole,
        privilegeExpireTs,
        privilegeExpireTs,
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        appId: String(appId),
        token,
        channelName,
        uid: Number(uid) || 0,
        mode: appCertificate ? "token" : "testing",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("agora-token error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
