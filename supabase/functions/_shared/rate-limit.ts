// Shared abuse protection for edge functions.
// Backed by public.rate_limits + public.consume_rate_limit (service_role only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Returns null when the caller is allowed, otherwise a 429 Response to return.
 * Fails OPEN on infrastructure errors so a limiter outage never blocks logins.
 */
export async function enforceRateLimit(opts: {
  bucket: string;
  identifier: string;
  max: number;
  windowSeconds: number;
  corsHeaders: Record<string, string>;
  message?: string;
}): Promise<Response | null> {
  const { bucket, identifier, max, windowSeconds, corsHeaders } = opts;
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data, error } = await admin.rpc("consume_rate_limit", {
      _bucket: bucket,
      _identifier: identifier,
      _max_hits: max,
      _window_seconds: windowSeconds,
    });
    if (error) return null; // fail open
    const result = data as { allowed: boolean; retry_after: number };
    if (result?.allowed === false) {
      return new Response(
        JSON.stringify({
          error: opts.message ?? "عدد المحاولات كبير جداً، يرجى المحاولة لاحقاً",
          retry_after: result.retry_after,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "Retry-After": String(result.retry_after ?? windowSeconds),
          },
        },
      );
    }
    return null;
  } catch (_e) {
    return null; // fail open
  }
}
