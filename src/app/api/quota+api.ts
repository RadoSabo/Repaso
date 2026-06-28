/**
 * Read-only free-generation quota for a device. The generate screen calls this
 * to show "X generations left" without spending a generation.
 *   GET /api/quota?deviceId=…  →  { remaining: number }
 *
 * Fails closed (500) when the KV store isn't configured — consistent with the
 * generate route, which refuses to serve without it. See
 * docs/plans/mvp-monetization.md.
 */

import { FREE_GENERATIONS } from '@/lib/limits';
import { clientIp, getFreeGenCount, json, kvConfigured, rateLimited } from '@/lib/server-proxy';

export async function GET(request: Request): Promise<Response> {
  if (rateLimited(clientIp(request))) {
    return json({ error: 'Too many requests.' }, 429);
  }

  if (!kvConfigured()) {
    return json({ error: 'Server is missing the quota store configuration.' }, 500);
  }

  const deviceId = new URL(request.url).searchParams.get('deviceId') ?? '';
  if (!deviceId) {
    return json({ error: 'Missing device id.' }, 400);
  }

  const used = await getFreeGenCount(deviceId);
  return json({ remaining: Math.max(0, FREE_GENERATIONS - used) });
}
