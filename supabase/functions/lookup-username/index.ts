import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function supports two modes:
//   1) Sign-in by username (public): { username, password } -> returns auth session.
//      The email is never returned to the client, preventing enumeration.
//   2) Email lookup (admin-only): { username } with admin Bearer token -> returns email.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { username, password } = await req.json()
    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ error: 'اسم المستخدم مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const normalizedUsername = username.replace(/^@+/, '').trim().toLowerCase()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('id, is_suspended, is_banned')
      .eq('username', normalizedUsername).maybeSingle()
    if (profileError) {
      console.error('SUPABASE AUTH ERROR:', profileError)
      return new Response(JSON.stringify({ error: profileError.message, raw: profileError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!profile) {
      return new Response(JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (profile.is_suspended || profile.is_banned) {
      return new Response(JSON.stringify({ error: 'هذا الحساب مجمد حالياً.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ---- Mode 1: sign-in by username (public path) ----
    if (typeof password === 'string' && password.length > 0) {
      const { data: u, error: getUserError } = await supabase.auth.admin.getUserById(profile.id)
      if (getUserError) {
        console.error('SUPABASE AUTH ERROR:', getUserError)
        return new Response(JSON.stringify({ error: getUserError.message, raw: getUserError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (!u?.user?.email) {
        return new Response(JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
      const { data: signin, error: signErr } = await anon.auth.signInWithPassword({
        email: u.user.email, password,
      })
      if (signErr || !signin.session) {
        if (signErr) console.error('SUPABASE AUTH ERROR:', signErr)
        return new Response(JSON.stringify({ error: signErr?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة', raw: signErr }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ session: signin.session }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ---- Mode 2: email lookup (admin-only) ----
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } })
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''))
    const callerId = claims?.claims?.sub as string | undefined
    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: isAdmin } = await supabase.from('user_roles')
      .select('role').eq('user_id', callerId).eq('role', 'admin').maybeSingle()
    if (callerId !== profile.id && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: u } = await supabase.auth.admin.getUserById(profile.id)
    return new Response(JSON.stringify({ email: u?.user?.email ?? null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('SUPABASE AUTH ERROR:', e)
    const message = e instanceof Error ? e.message : 'حدث خطأ في الخادم'
    return new Response(JSON.stringify({ error: message, raw: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
