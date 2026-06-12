// Admin-only: bulk delete previously-created test users.
// Body: { prefix?: string (default "mock"), dryRun?: boolean, maxDelete?: number }
// Targets users whose email ends with @networkk.test AND starts with `${prefix}+`.
// Deletes via auth.admin.deleteUser, which cascades to public.profiles (FK ON DELETE CASCADE).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = await requireAdmin(req, corsHeaders);
  if (denied) return denied;

  let body: any = {};
  try { body = await req.json(); } catch {}
  const prefix = (typeof body.prefix === "string" && /^[a-z0-9_-]{2,20}$/.test(body.prefix)) ? body.prefix : "mock";
  const dryRun = body.dryRun === true;
  const maxDelete = Math.min(Math.max(parseInt(body.maxDelete ?? "5000", 10) || 5000, 1), 10000);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const matched: { id: string; email: string }[] = [];
  let page = 1;
  const perPage = 1000;

  while (matched.length < maxDelete) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const users = data?.users ?? [];
    if (users.length === 0) break;
    for (const u of users) {
      const email = u.email ?? "";
      const isMockMeta = (u.user_metadata as any)?.is_mock === true && (u.user_metadata as any)?.mock_prefix === prefix;
      const isMockEmail = email.endsWith("@networkk.test") && email.startsWith(`${prefix}+`);
      if (isMockMeta || isMockEmail) {
        matched.push({ id: u.id, email });
        if (matched.length >= maxDelete) break;
      }
    }
    if (users.length < perPage) break;
    page++;
  }

  if (dryRun) {
    return new Response(JSON.stringify({ ok: true, dryRun: true, wouldDelete: matched.length, sample: matched.slice(0, 5) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let deleted = 0;
  let failed = 0;
  const errors: string[] = [];
  const batchSize = 50;

  for (let i = 0; i < matched.length; i += batchSize) {
    const chunk = matched.slice(i, i + batchSize);
    await Promise.all(chunk.map(async (u) => {
      const { error } = await admin.auth.admin.deleteUser(u.id);
      if (error) {
        failed++;
        if (errors.length < 10) errors.push(`${u.email}: ${error.message}`);
      } else {
        deleted++;
      }
    }));
    if (i + batchSize < matched.length) await sleep(150);
  }

  return new Response(JSON.stringify({ ok: true, deleted, failed, prefix, sampleErrors: errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
