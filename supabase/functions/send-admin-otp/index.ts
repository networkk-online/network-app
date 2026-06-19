import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, email, password, code, userId } = body;

    if (action === "send") {
      // Verify email + password
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.signInWithPassword({ email, password });

      if (authError || !authData.user) {
        return new Response(
          JSON.stringify({ error: "بيانات الدخول غير صحيحة" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check admin role
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id);

      const isAdmin = roles?.some(
        (r: any) => r.role === "admin" || r.role === "moderator"
      );

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "غير مصرح بالدخول" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate 6-digit OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));

      // Invalidate old codes
      await supabaseAdmin
        .from("admin_otp_codes")
        .delete()
        .eq("user_id", authData.user.id);

      // Store new code (expires in 5 min)
      await supabaseAdmin.from("admin_otp_codes").insert({
        user_id: authData.user.id,
        code: otpCode,
      });

      // Send via Resend - REQUIRED. Never expose OTP via response or logs.
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) {
        return new Response(
          JSON.stringify({ error: "خدمة البريد غير مهيأة. يرجى إعداد RESEND_API_KEY." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Network <noreply@networkk.online>",
          to: [email],
          subject: "رمز التحقق",
          html: `<div dir="rtl" style="font-family:sans-serif;padding:20px;background:#111;color:#0f0;border-radius:8px"><h2>رمز التحقق</h2><p style="font-size:32px;letter-spacing:8px;font-weight:bold">${otpCode}</p><p>ينتهي خلال 5 دقائق</p></div>`,
        }),
      });
      if (!emailRes.ok) {
        return new Response(
          JSON.stringify({ error: "تعذر إرسال البريد" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, userId: authData.user.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!code || !userId) {
        return new Response(
          JSON.stringify({ error: "البيانات مفقودة" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: otpData } = await supabaseAdmin
        .from("admin_otp_codes")
        .select("*")
        .eq("user_id", userId)
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .single();

      if (!otpData) {
        return new Response(
          JSON.stringify({ error: "رمز التحقق غير صحيح أو منتهي" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as used
      await supabaseAdmin
        .from("admin_otp_codes")
        .update({ used: true })
        .eq("id", otpData.id);

      // Look up the user's email to mint a server-side session token
      const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = userInfo?.user?.email;
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: "تعذر إنشاء جلسة الدخول" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail,
      });
      if (linkErr || !linkData?.properties?.hashed_token) {
        return new Response(
          JSON.stringify({ error: "تعذر إنشاء جلسة الدخول" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, verified: true, token_hash: linkData.properties.hashed_token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "خطأ في الخادم" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
