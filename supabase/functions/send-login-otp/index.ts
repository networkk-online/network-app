// Validates the user's password server-side, then triggers a native Supabase
// OTP email via auth-email-hook (which renders our branded dark/neon template).
// No external email provider, no Resend API key required.

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
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "البيانات مفقودة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Validate credentials (isolated client, never persists session)
    const tempClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } =
      await tempClient.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "البريد أو كلمة المرور غير صحيحة" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Immediately revoke the temporary session
    await tempClient.auth.signOut();

    // 2) Trigger the native OTP email via Supabase Auth → auth-email-hook
    //    will render our custom dark/neon magic-link template containing the
    //    6-digit code (`token`). Client will then call supabase.auth.verifyOtp
    //    with type: 'email' to mint a real session.
    const { error: otpErr } = await admin.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (otpErr) {
      console.error("signInWithOtp err:", otpErr);
      return new Response(
        JSON.stringify({ error: "تعذر إرسال رمز التحقق، حاول مجدداً" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true, emailSent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-login-otp fatal:", err);
    return new Response(JSON.stringify({ error: "خطأ في الخادم" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
