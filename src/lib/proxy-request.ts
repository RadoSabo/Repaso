/**
 * Shared client plumbing for the proxy API routes (`app/api/*+api.ts`): one
 * POST + error-mapping pipeline so the generation / image / voice clients don't
 * each reimplement the 402 / 429 / failure handling.
 *
 * Raw server response bodies are logged for debugging but never surfaced to
 * users — every thrown message is a translated string.
 */

import i18n from '@/i18n';
import { PROXY_URL } from './config';

/** Base error for proxy calls. Callers throw feature-specific subclasses. */
export class ProxyError extends Error {
  /** True when the server blocked the call pending an upgrade — route to the paywall. */
  readonly paywall: boolean;
  constructor(message: string, options?: { paywall?: boolean }) {
    super(message);
    this.paywall = options?.paywall ?? false;
  }
}

export interface ProxyRequestOptions {
  /** Route path, e.g. `/api/generate`. */
  path: string;
  /** JSON-serializable request body. */
  body: unknown;
  /** Error subclass to throw so `instanceof` checks in callers keep working. */
  error: new (message: string, options?: { paywall?: boolean }) => ProxyError;
  /** Locale key when the request can't reach the server at all. */
  cannotReachKey: string;
  /** Locale key for HTTP 402 (thrown with `paywall: true`). */
  paywallKey: string;
  /** Locale key for HTTP 429. */
  rateLimitedKey: string;
  /** Locale key for any other failure; interpolates `{{status}}`. */
  failedKey: string;
}

/**
 * POSTs a JSON body to a proxy route and returns the parsed JSON response
 * (null when the body isn't valid JSON). Failures throw the given error class
 * with a translated message.
 */
export async function postToProxy<T>(options: ProxyRequestOptions): Promise<T | null> {
  const { path, body, error: ErrorClass } = options;

  let res: Response;
  try {
    res = await fetch(`${PROXY_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.warn(`[proxy] ${path} unreachable`, e);
    throw new ErrorClass(i18n.t(options.cannotReachKey));
  }

  if (!res.ok) {
    if (res.status === 402) {
      throw new ErrorClass(i18n.t(options.paywallKey), { paywall: true });
    }
    if (res.status === 429) {
      throw new ErrorClass(i18n.t(options.rateLimitedKey));
    }
    const detail = await res.text().catch(() => '');
    console.warn(`[proxy] ${path} failed`, { status: res.status, detail });
    throw new ErrorClass(i18n.t(options.failedKey, { status: res.status }));
  }

  return (await res.json().catch(() => null)) as T | null;
}
