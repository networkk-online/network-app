// Admin-only: bulk create test users via Supabase Auth.
// Body: { count?: number (default 2500, max 5000), batchSize?: number (default 50), prefix?: string }
// Emails follow pattern: `${prefix}+<n>-<rand>@networkk.test` so they can be cleaned up later.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRST_NAMES = ["أحمد","محمد","علي","حسين","يوسف","عبدالله","سارة","ليلى","فاطمة","نور","زينب","مريم","حسن","كرار","مصطفى","رنا","هدى","دانية","رغد","عمر"];
const LAST_NAMES = ["العراقي","البغدادي","الموصلي","البصري","النجفي","الكربلائي","الأنباري","السامرائي","الكاظمي","الحيدري"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randSuffix(len = 6) {
  return Array.from({ length: len }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req, corsHeaders);
  if (denied) return denied;

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const count = Math.min(Math.max(parseInt(body.count ?? "2500", 10) || 2500, 1), 5000);
  const batchSize = Math.min(Math.max(parseInt(body.batchSize ?? "50", 10) || 50, 1), 200);
  const prefix = (typeof body.prefix === "string" && /^[a-z0-9_-]{2,20}$/.test(body.prefix)) ? body.prefix : "mock";

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let start = 0; start < count; start += batchSize) {
    const end = Math.min(start + batchSize, count);
    const tasks: Promise<void>[] = [];

    for (let i = start; i < end; i++) {
      const idx = i + 1;
      const suffix = randSuffix(8);
      const email = `${prefix}+${idx}-${suffix}@networkk.test`;
      const username = `${prefix}_${idx}_${suffix}`;
      const first = rand(FIRST_NAMES);
      const last = rand(LAST_NAMES);
      const full_name = `${first} ${last}`;
      const password = `Mock!${suffix}${idx}`;

      tasks.push((async () => {
        const { error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username, full_name, is_mock: true, mock_prefix: prefix },
        });
        if (error) {
          failed++;
          if (errors.length < 10) errors.push(`${email}: ${error.message}`);
        } else {
          created++;
        }
      })());
    }

    await Promise.all(tasks);
    // Small pause between batches to avoid hammering rate limits
    if (end < count) await sleep(150);
  }

  return new Response(
    JSON.stringify({ ok: true, requested: count, created, failed, batchSize, prefix, sampleErrors: errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
