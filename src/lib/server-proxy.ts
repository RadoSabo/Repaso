/**
 * Server-only helpers shared by the proxy API routes (`app/api/*+api.ts`).
 * These run on EAS Hosting / the Expo dev server and are never bundled into the
 * client. Keep all OpenAI access and request-hardening here.
 *
 * The spend gates live here, never on the client (`useEntitlement` is UX only):
 *  - `requirePro(appUserId)` — confirms the RevenueCat `unlimited` entitlement
 *    for the Pro-only voice/image routes and for unlimited generation.
 *  - `getFreeGenCount` / `incrementFreeGen` — the per-device free-generation
 *    counter in Upstash Redis, enforced by the generate route.
 * See docs/plans/mvp-monetization.md.
 */

import { FREE_PERIOD_DAYS, PRO_ENTITLEMENT_ID } from '@/lib/limits';

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

// --- Free-generation quota (Upstash Redis KV) ------------------------------

const SECONDS_PER_DAY = 86_400;

/** True when the Upstash REST credentials are present (set in production env). */
export function kvConfigured(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}

/** Run one Redis command via the Upstash REST API. Assumes `kvConfigured()`. */
async function kvCommand(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`KV ${command[0]} failed (HTTP ${res.status}).`);
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(`KV error: ${data.error}`);
  return data.result;
}

const freeGenKey = (deviceId: string) => `freegen:${deviceId}`;

/** Free generations already used by this device in the current rolling window. */
export async function getFreeGenCount(deviceId: string): Promise<number> {
  const result = await kvCommand(['GET', freeGenKey(deviceId)]);
  return result == null ? 0 : Number(result) || 0;
}

/**
 * Count one successful free generation. Sets the rolling-window TTL only when
 * the key is first created (`EXPIRE … NX`), so the 30-day window starts at the
 * first generation and resets when it elapses.
 */
export async function incrementFreeGen(deviceId: string): Promise<void> {
  const key = freeGenKey(deviceId);
  await kvCommand(['INCR', key]);
  await kvCommand(['EXPIRE', key, FREE_PERIOD_DAYS * SECONDS_PER_DAY, 'NX']);
}

// --- Pro entitlement (RevenueCat REST) -------------------------------------

interface RevenueCatSubscriber {
  subscriber?: { entitlements?: Record<string, { expires_date?: string | null }> };
}

const REVENUECAT_SUBSCRIBERS_URL = 'https://api.revenuecat.com/v1/subscribers';

/**
 * Whether `appUserId` (the caller's RevenueCat anonymous app-user-ID) currently
 * has the `unlimited` entitlement active. Source of truth before any OpenAI spend
 * on Pro-only routes / unlimited generation.
 *
 * Fails CLOSED: if the entitlement can't be verified — no secret key configured,
 * no app-user-id, or the RevenueCat call fails — it returns false. Spend is never
 * ungated, in any environment.
 */
export async function requirePro(appUserId: string): Promise<boolean> {
  const secret = process.env.REVENUECAT_SECRET_KEY;
  if (!secret || !appUserId) return false;

  let res: Response;
  try {
    res = await fetch(`${REVENUECAT_SUBSCRIBERS_URL}/${encodeURIComponent(appUserId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
  } catch {
    return false;
  }
  if (!res.ok) return false;

  const data = (await res.json().catch(() => null)) as RevenueCatSubscriber | null;
  const entitlement = data?.subscriber?.entitlements?.[PRO_ENTITLEMENT_ID];
  if (!entitlement) return false;
  // A null expiry is a lifetime entitlement; otherwise it must be in the future.
  const expires = entitlement.expires_date;
  return expires == null || new Date(expires).getTime() > Date.now();
}
