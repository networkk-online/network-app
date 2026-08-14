import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { enforceRateLimit, clientIp } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// This function supports two modes:
//   1) Sign-in by username (public): { username, password } -> returns auth session.
//      The email is never returned to the client, preventing enumeration.
//   2) Email lookup (admin-only): { username } with admin Bearer token -> returns email.
//
// IMPORTANT: All expected failures return HTTP 200 with an `error` field so that
// `supabase.functions.invoke()` on the client receives the JSON body in `data`
// (non-2xx responses are surfaced only as a generic "non-2xx status code" error
// with the body dropped by supabase-js). Only unexpected server issues use 5xx.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    let body: any = {}
    try { body = await req.json() } catch { /* ignore */ }
    const { username, password } = body || {}

    if (!username || typeof username !== 'string') {
      return json({ error: 'اسم المستخدم مطلوب' })
    }

    const normalizedUsername = username.replace(/^@+/, '').trim().toLowerCase()

    // Abuse protection: 15 attempts / 10 min per username, 60 per IP
    const limited =
      (await enforceRateLimit({ bucket: 'lookup-username', identifier: normalizedUsername, max: 15, windowSeconds: 600, corsHeaders })) ||
      (await enforceRateLimit({ bucket: 'lookup-username-ip', identifier: clientIp(req), max: 60, windowSeconds: 600, corsHeaders }))
    if (limited) return limited

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')
    if (!SUPABASE_URL || !SERVICE_ROLE || !ANON) {
      console.error('lookup-username: missing env vars')
      return json({ error: 'إعدادات الخادم غير مكتملة' }, 500)
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('id, is_suspended, is_banned')
      .ilike('username', normalizedUsername).maybeSingle()

    if (profileError) {
      console.error('profile lookup error:', profileError)
      return json({ error: 'تعذر التحقق من الحساب' }, 500)
    }
    if (!profile) {
      return json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' })
    }
    if (profile.is_suspended || profile.is_banned) {
      return json({ error: 'هذا الحساب مجمد حالياً.' })
    }

    // ---- Mode 1: sign-in by username (public path) ----
    if (typeof password === 'string' && password.length > 0) {
      const { data: u, error: getUserError } = await supabase.auth.admin.getUserById(profile.id)
      if (getUserError) {
        console.error('getUserById error:', getUserError)
        return json({ error: 'تعذر تسجيل الدخول، حاول لاحقاً' }, 500)
      }
      if (!u?.user?.email) {
        return json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' })
      }
      const anon = createClient(SUPABASE_URL, ANON)
      const { data: signin, error: signErr } = await anon.auth.signInWithPassword({
        email: u.user.email, password,
      })
      if (signErr || !signin.session) {
        return json({ error: signErr?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة' })
      }
      return json({ session: signin.session })
    }

    // ---- Mode 2: email lookup (admin-only) ----
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' })
    }
    const userClient = createClient(SUPABASE_URL, ANON,
      { global: { headers: { Authorization: authHeader } } })
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''))
    const callerId = claims?.claims?.sub as string | undefined
    if (!callerId) {
      return json({ error: 'Unauthorized' })
    }
    const { data: isAdmin } = await supabase.from('user_roles')
      .select('role').eq('user_id', callerId).eq('role', 'admin').maybeSingle()
    if (callerId !== profile.id && !isAdmin) {
      return json({ error: 'Forbidden' })
    }
    const { data: u } = await supabase.auth.admin.getUserById(profile.id)
    return json({ email: u?.user?.email ?? null })
  } catch (e) {
    console.error('lookup-username unexpected error:', e)
    const message = e instanceof Error ? e.message : 'حدث خطأ في الخادم'
    return json({ error: message }, 500)
  }
})
