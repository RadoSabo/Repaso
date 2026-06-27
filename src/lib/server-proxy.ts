/**
 * Server-only helpers shared by the proxy API routes (`app/api/*+api.ts`).
 * These run on EAS Hosting / the Expo dev server and are never bundled into the
 * client. Keep all OpenAI access and request-hardening here.
 *
 * TODO(monetization Phase 2/3): once Supabase auth + RevenueCat land, add a
 * `requirePro(request)` helper here that verifies the caller's access token and
 * entitlement, and call it from the image/voice routes (Pro-only) and inside the
 * free-quota check on the generate route. The client `useEntitlement` flag is
 * UX only — the spend gate must live here. See docs/plans/monetization-and-sync.md.
 */

// Best-effort in-memory rate limit (per server instance). Good enough for an
// MVP; swap for a shared store (KV/Redis) when running multiple instances. The
// monetization plan replaces this with a persistent per-user limiter.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

/** Coarse client identifier for rate limiting, from proxy headers. */
export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** OpenAI chat/completions endpoint, shared by the text and vision routes. */
export const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
