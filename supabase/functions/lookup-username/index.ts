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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profile } = await supabase
      .from('profiles').select('id')
      .eq('username', username.trim().toLowerCase()).maybeSingle()
    if (!profile) {
      return new Response(JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ---- Mode 1: sign-in by username (public path) ----
    if (typeof password === 'string' && password.length > 0) {
      const { data: u } = await supabase.auth.admin.getUserById(profile.id)
      if (!u?.user?.email) {
        return new Response(JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
      const { data: signin, error: signErr } = await anon.auth.signInWithPassword({
        email: u.user.email, password,
      })
      if (signErr || !signin.session) {
        return new Response(JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
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
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'حدث خطأ في الخادم' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
