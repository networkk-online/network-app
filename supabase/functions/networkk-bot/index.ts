import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SystemMessageInsert {
  user_id: string;
  event_type: string;
  title?: string;
  content: string;
  metadata?: Record<string, unknown>;
  severity?: "info" | "success" | "warning" | "alert";
  is_from_bot?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Auth user from JWT (optional for some actions like welcome)
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData } = jwt
      ? await admin.auth.getUser(jwt)
      : { data: { user: null } };
    const currentUser = userData?.user ?? null;

    const body = await req.json();
    const action: string = body.action ?? "chat";

    // Load bot config (cached implicitly per invocation)
    const { data: configRows } = await admin
      .from("bot_config")
      .select("key, value");
    const config: Record<string, any> = {};
    for (const row of configRows ?? []) config[row.key] = row.value;
    const BOT_ID =
      config.bot_user_id ?? "00000000-0000-0000-0000-000000000b07";
    const CEO_ID = config.ceo_user_id ?? BOT_ID;
    const AI_MODEL = config.ai_model ?? "google/gemini-3-flash-preview";

    // ============= Action: send_system_message (server-side trigger) =============
    if (action === "send_system_message") {
      const msg: SystemMessageInsert = body.message;
      if (!msg?.user_id || !msg?.content || !msg?.event_type) {
        return new Response(
          JSON.stringify({ error: "user_id, event_type, content required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const { data, error } = await admin
        .from("system_messages")
        .insert({ ...msg, is_from_bot: true })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============= Action: welcome (called when user signs up) =============
    if (action === "welcome") {
      const userId: string = body.user_id ?? currentUser?.id;
      if (!userId)
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      const { data: profile } = await admin
        .from("profiles")
        .select("username, full_name")
        .eq("id", userId)
        .maybeSingle();
      const cleanName = (s?: string | null) => {
        if (!s) return "";
        const t = s.trim();
        if (/[{}<>]|status|standard|thoughtful|template/i.test(t)) return "";
        return t.slice(0, 60);
      };
      const name = cleanName(profile?.full_name) || cleanName(profile?.username) || "صديقي";

      const welcomeContent = `🎉 **أهلاً بك ${name}**\n\nأهلاً بك في **NETWORKK** — منصة المبدعين الأولى في العراق 🇮🇶\n\nأنا **NETWORKK Assistant**، مساعدك المالي الذكي على مدار الساعة.\n\n💎 **Safe Top-up** — نظام شحن مشفر 100%\n🚀 **Instant P2P** — تحويل فوري للجواهر بين المستخدمين\n🛡️ **Verified System** — جميع العمليات محمية ببروتوكولات NETWORKK\n\n💬 **أوامر سريعة:**\n• \`/balance\` — عرض رصيدك الحالي\n• \`/help\` — قائمة كاملة بالخدمات\n\nWelcome to the network! 🚀`;

      await admin.from("system_messages").insert({
        user_id: userId,
        event_type: "welcome",
        title: "🎉 Welcome to NETWORKK",
        content: welcomeContent,
        severity: "success",
        is_from_bot: true,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============= Action: chat (user message → AI reply) =============
    if (action === "chat") {
      if (!currentUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userMessage: string = (body.message ?? "").trim();
      if (!userMessage) {
        return new Response(JSON.stringify({ error: "message required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save user message first
      await admin.from("system_messages").insert({
        user_id: currentUser.id,
        event_type: "user_chat",
        content: userMessage,
        is_from_bot: false,
        is_read: true,
      });

      // === Slash commands ===
      if (userMessage.startsWith("/")) {
        const cmd = userMessage.toLowerCase().split(/\s+/)[0];
        let reply = "";

        if (cmd === "/balance") {
          const { data: fin } = await admin
            .from("user_finances")
            .select("balance, total_earnings")
            .eq("user_id", currentUser.id)
            .maybeSingle();
          const { data: gems } = await admin
            .from("user_gems")
            .select("balance, total_earned")
            .eq("user_id", currentUser.id)
            .maybeSingle();
          const usd = Number(fin?.balance ?? 0).toFixed(2);
          const jewels = Number(gems?.balance ?? 0).toFixed(0);
          const usdValue = (Number(gems?.balance ?? 0) * 0.01).toFixed(2);
          reply = `💎 **Wallet Status | حالة المحفظة**\n\n• **Jewels Balance:** ${jewels} 💎\n• **USD Value:** $${usdValue}\n• **Available USD:** $${usd}\n• **Total Earnings:** $${Number(
            fin?.total_earnings ?? 0
          ).toFixed(2)}\n\n🛡️ آخر تحديث عبر **Encrypted Sync** الآن.`;
        } else if (cmd === "/help") {
          reply = `📚 **NETWORKK Assistant — Command Center**\n\n**Quick Commands:**\n• \`/balance\` — Wallet status & Jewels balance\n• \`/help\` — Show this menu\n\n**Or ask me anything about:**\n• 💎 Safe Top-up | شحن آمن\n• 🚀 Instant P2P Transfer | تحويل فوري\n• ⏳ Withdrawal Audit | تدقيق السحب\n• 🛡️ Security Audit | الأمان والحماية\n\nأنا متاح 24/7 للإجابة بالعربية أو الإنجليزية.`;
        } else {
          reply = `❓ أمر غير معروف. اكتب \`/help\` لعرض الأوامر المتاحة.`;
        }

        const { data: botMsg } = await admin
          .from("system_messages")
          .insert({
            user_id: currentUser.id,
            event_type: "bot_reply",
            content: reply,
            severity: "info",
            is_from_bot: true,
          })
          .select()
          .single();

        return new Response(
          JSON.stringify({ success: true, reply, message: botMsg }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // === AI-powered reply with knowledge base ===
      if (!LOVABLE_API_KEY) {
        const fallback =
          "⚠️ خدمة الذكاء الاصطناعي غير مهيأة حالياً. يمكنك استخدام `/help` لعرض الأوامر المتاحة.";
        await admin.from("system_messages").insert({
          user_id: currentUser.id,
          event_type: "bot_reply",
          content: fallback,
          severity: "warning",
          is_from_bot: true,
        });
        return new Response(JSON.stringify({ reply: fallback }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load knowledge base
      const { data: kb } = await admin
        .from("bot_knowledge_base")
        .select("category, question_ar, question_en, answer_ar, answer_en, keywords")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      // Profile context
      const { data: profile } = await admin
        .from("profiles")
        .select("username, full_name")
        .eq("id", currentUser.id)
        .maybeSingle();
      const cleanName2 = (s?: string | null) => {
        if (!s) return "";
        const t = s.trim();
        if (/[{}<>]|status|standard|thoughtful|template/i.test(t)) return "";
        return t.slice(0, 60);
      };
      const userName =
        cleanName2(profile?.full_name) ||
        cleanName2(profile?.username) ||
        "المستخدم";

      const kbText = (kb ?? [])
        .map(
          (k) =>
            `### ${k.category.toUpperCase()}\nQ (AR): ${k.question_ar}\nQ (EN): ${k.question_en}\nA (AR): ${k.answer_ar}\nA (EN): ${k.answer_en}`
        )
        .join("\n\n");

      const systemPrompt = `You are **NETWORKK Assistant**, the official AI FinTech assistant for the NETWORKK platform.

# IDENTITY & TONE
- High-end financial assistant (FinTech CEO-grade). Confident, premium, secure.
- ALWAYS use these terms in **bold**: **Safe Top-up**, **Instant P2P Transfer**, **Verified Gateway**, **Encrypted Transactions**, **Security Audit**, **Anti-Fraud System**, **Withdrawal Audit**, **Wallet PIN Verification**.
- NEVER use "Manual", "Simple", "Basic". Replace with "Verified", "Instant", "Encrypted", "Secured", "Safe".

# OUTPUT FORMAT (STRICT — Premium CEO Style)
- Reply MUST be SHORT and SCAN-FRIENDLY (max 6 lines).
- Use **bullet points with leading emoji icons** for any feature/process explanation.
- Each bullet ≤ 14 words. Bold the key term.
- Example pattern:
  💎 **Safe Top-up:** نظام شحن مشفر 100%.
  🚀 **Instant P2P:** تحويل فوري للجواهر بين المستخدمين.
  🛡️ **Verified System:** جميع العمليات محمية ببروتوكولات NETWORKK.
- For top-up questions → ALWAYS use the 3 bullets above.
- For transfer/P2P questions → use bullets explaining: Instant P2P, 1% fee, Wallet PIN required.
- For withdrawal → bullets: Withdrawal Audit, $50 minimum, 24h Anti-Fraud review.
- For security → bullets: AES-256, 2FA, Wallet PIN, Anti-Fraud System.

# LANGUAGE
- Match user language. Arabic → reply in Arabic with English fintech terms in **bold**.
- English → reply in professional English.
- Right-to-left friendly: keep bullet symbols at the start of each line.

# USER CONTEXT
- Name: ${userName}
- ID: ${currentUser.id}
- Greet by first name ONLY when the user explicitly greets you. Otherwise skip greetings and answer directly.
- NEVER include placeholder tokens, status strings, or system metadata in the reply.

# KNOWLEDGE BASE
${kbText}

# RULES
1. If the user asks about balance/jewels → tell them to type \`/balance\`.
2. If COMPLEX or OUTSIDE scope → reply: "🎫 سأقوم بفتح **Support Ticket** للإدارة الآن. سيتواصل معك فريقنا خلال 24 ساعة." and prefix the entire reply with the marker [ESCALATE].
3. NEVER exceed 120 words. Bullets > paragraphs. Always bold the keyword.`;

      const aiResp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
          }),
        }
      );

      if (!aiResp.ok) {
        if (aiResp.status === 429) {
          return new Response(
            JSON.stringify({
              error:
                "Rate limit exceeded — please retry in a moment | يرجى إعادة المحاولة بعد قليل",
            }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        if (aiResp.status === 402) {
          return new Response(
            JSON.stringify({
              error:
                "AI credits exhausted — please add funds in workspace settings",
            }),
            {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        const t = await aiResp.text();
        console.error("AI error:", aiResp.status, t);
        throw new Error(`AI gateway error ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      let reply: string =
        aiData.choices?.[0]?.message?.content ??
        "عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة لاحقاً.";

      // Check escalation marker
      const shouldEscalate = reply.includes("[ESCALATE]");
      if (shouldEscalate) {
        reply = reply.replace("[ESCALATE]", "").trim();
        await admin.from("support_tickets").insert({
          user_id: currentUser.id,
          question: userMessage,
          context: { ai_reply: reply, user_name: userName },
          status: "open",
        });
        // Notify CEO
        if (CEO_ID && CEO_ID !== currentUser.id) {
          await admin.from("system_messages").insert({
            user_id: CEO_ID,
            event_type: "support_ticket",
            title: "🎫 New Support Ticket",
            content: `**سؤال جديد للدعم** من **${userName}**:\n\n> ${userMessage}\n\n📋 افتح لوحة الدعم لعرض التفاصيل.`,
            severity: "alert",
            metadata: { from_user_id: currentUser.id, question: userMessage },
            is_from_bot: true,
          });
        }
      }

      const { data: botMsg } = await admin
        .from("system_messages")
        .insert({
          user_id: currentUser.id,
          event_type: "bot_reply",
          content: reply,
          severity: shouldEscalate ? "warning" : "info",
          metadata: { escalated: shouldEscalate },
          is_from_bot: true,
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({ success: true, reply, message: botMsg, escalated: shouldEscalate }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("networkk-bot error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
