import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://network-app.lovable.app/network-email-logo.png";

function buildEmailHtml(code: string) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>رمز التحقق - Network</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI','Cairo',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:linear-gradient(180deg,#0d0d10 0%,#09090b 100%);border:1px solid rgba(16,185,129,0.25);border-radius:24px;box-shadow:0 0 60px rgba(16,185,129,0.18),inset 0 1px 0 rgba(255,255,255,0.04);overflow:hidden;">
          <!-- Glow top bar -->
          <tr><td style="height:3px;background:linear-gradient(90deg,transparent 0%,#10b981 50%,transparent 100%);"></td></tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:44px 32px 16px;">
              <img src="${LOGO_URL}" alt="Network" width="92" height="92" style="display:block;border-radius:20px;box-shadow:0 0 40px rgba(16,185,129,0.45);" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:8px 32px 4px;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">رمز التحقق الخاص بك</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:6px 32px 28px;">
              <p style="margin:0;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.55);">
                استخدم الرمز التالي لإتمام تسجيل الدخول إلى تطبيق <span style="color:#10b981;font-weight:600;">Network</span>
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td align="center" style="padding:0 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.35);border-radius:18px;box-shadow:0 0 30px rgba(16,185,129,0.2),inset 0 0 20px rgba(16,185,129,0.05);">
                <tr>
                  <td align="center" style="padding:26px 40px;" dir="ltr">
                    <div style="font-family:'Courier New',monospace;font-size:44px;font-weight:800;color:#10b981;letter-spacing:14px;text-shadow:0 0 18px rgba(16,185,129,0.55);">
                      ${code}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td align="center" style="padding:0 32px 8px;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);">
                ينتهي هذا الرمز خلال <span style="color:#10b981;font-weight:600;">5 دقائق</span>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(16,185,129,0.25),transparent);"></div>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:20px 32px 32px;">
              <p style="margin:0;font-size:12px;line-height:1.8;color:rgba(255,255,255,0.4);text-align:center;">
                إذا لم تطلب تسجيل الدخول، يمكنك تجاهل هذه الرسالة بأمان. لن يتمكن أحد من الوصول إلى حسابك دون هذا الرمز.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:18px 32px 28px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.04);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:0.5px;">
                © Network — جميع الحقوق محفوظة
              </p>
            </td>
          </tr>

          <tr><td style="height:3px;background:linear-gradient(90deg,transparent 0%,#10b981 50%,transparent 100%);"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "البيانات مفقودة" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate credentials
    const { data: authData, error: authError } = await admin.auth.signInWithPassword({
      email, password,
    });
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "البريد أو كلمة المرور غير صحيحة" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sign out the temp session immediately
    await admin.auth.signOut();

    const userId = authData.user.id;
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    // Invalidate old codes
    await admin.from("login_otp_codes").delete().eq("user_id", userId);

    // Store new code
    const { error: insertErr } = await admin.from("login_otp_codes").insert({
      user_id: userId,
      email: email.toLowerCase(),
      code: otpCode,
    });
    if (insertErr) {
      console.error("insert err", insertErr);
      return new Response(JSON.stringify({ error: "تعذر إنشاء رمز التحقق" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[login-otp] ${email} → ${otpCode}`);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    if (resendKey) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Network <noreply@networkk.online>",
          to: [email],
          subject: "رمز التحقق الخاص بك - Network",
          html: buildEmailHtml(otpCode),
        }),
      });
      emailSent = r.ok;
      if (!r.ok) console.error("resend err", await r.text());
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        ...(emailSent ? {} : { debug_otp: otpCode }),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "خطأ في الخادم" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
