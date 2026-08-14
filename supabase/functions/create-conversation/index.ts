import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { enforceRateLimit, clientIp } from "../_shared/rate-limit.ts";

type CreateConversationBody = {
  otherUserId?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing backend configuration secrets");
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const limited = await enforceRateLimit({
      bucket: "create-conversation", identifier: clientIp(req), max: 60, windowSeconds: 600, corsHeaders,
    });
    if (limited) return limited;

    const body = (await req.json()) as CreateConversationBody;
    const otherUserId = body?.otherUserId;
    if (!otherUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing otherUserId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the caller identity using a user-scoped client.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = userData.user.id;

    // Use a privileged client for DB writes.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const db = admin.schema("public");

    // 1) Find existing conversation between the two users.
    const { data: myParts, error: myPartsErr } = await db
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (myPartsErr) throw myPartsErr;

    const myConversationIds = (myParts || []).map((p: { conversation_id: string }) => p.conversation_id);
    if (myConversationIds.length > 0) {
      const { data: otherPart, error: otherPartErr } = await db
        .from("conversation_participants")
        .select("conversation_id")
        .in("conversation_id", myConversationIds)
        .eq("user_id", otherUserId)
        .maybeSingle();

      if (otherPartErr) throw otherPartErr;
      if (otherPart?.conversation_id) {
        return new Response(
          JSON.stringify({ success: true, conversationId: otherPart.conversation_id, existed: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 2) Create conversation + participants atomically.
    const { data: newConv, error: convErr } = await db
      .from("conversations")
      .insert({})
      .select("id")
      .single();

    if (convErr) throw convErr;

    const conversationId = newConv.id as string;

    const { error: partsErr } = await db
      .from("conversation_participants")
      .insert([
        { conversation_id: conversationId, user_id: userId },
        { conversation_id: conversationId, user_id: otherUserId },
      ]);

    if (partsErr) throw partsErr;

    return new Response(
      JSON.stringify({ success: true, conversationId, existed: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("create-conversation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create conversation",
        details: error?.message ?? String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
