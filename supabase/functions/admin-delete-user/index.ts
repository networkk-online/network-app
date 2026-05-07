import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const json = (b: any) => new Response(JSON.stringify(b), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ ok: false, error: 'Missing Authorization' })

    const url = Deno.env.get('SUPABASE_URL') ?? ''
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })

    const { data: { user }, error: ue } = await userClient.auth.getUser()
    if (ue || !user) return json({ ok: false, error: 'Invalid token' })

    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
    if (!roles) return json({ ok: false, error: 'Permission denied' })

    const { userId } = await req.json()
    if (!userId) return json({ ok: false, error: 'Missing userId' })
    if (userId === user.id) return json({ ok: false, error: 'Cannot delete yourself' })

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return json({ ok: false, error: error.message })

    return json({ ok: true })
  } catch (e) {
    return json({ ok: false, error: (e as Error).message })
  }
})
