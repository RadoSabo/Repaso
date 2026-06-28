/**
 * Reads the device's remaining free generations from `/api/quota` so the screen
 * can show "X left" and pre-empt a generation that would be rejected. The server
 * is the real gate; this is display + a fast local guard. Pro users bypass it.
 */
import { useCallback, useEffect, useState } from 'react';

import { PROXY_URL } from '@/lib/config';
import { getDeviceId } from '@/lib/device-id';
import { FREE_GENERATIONS } from '@/lib/limits';

export interface GenerationQuota {
  /** Free generations left in the current rolling window (ignored when Pro). */
  remaining: number;
  /** Whether a generation may be attempted now. */
  canGenerate: boolean;
  /** Re-fetch the remaining count (call after a generation). */
  refresh: () => void;
}

/** Fetch the remaining count, or null on any failure (best-effort display). */
async function fetchRemaining(): Promise<number | null> {
  try {
    const deviceId = await getDeviceId();
    const res = await fetch(`${PROXY_URL}/api/quota?deviceId=${encodeURIComponent(deviceId)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { remaining?: number };
    return typeof data.remaining === 'number' ? data.remaining : null;
  } catch {
    return null;
  }
}

export function useGenerationQuota(isPro: boolean): GenerationQuota {
  const [remaining, setRemaining] = useState(FREE_GENERATIONS);

  const refresh = useCallback(() => {
    if (isPro) return;
    void (async () => {
      const value = await fetchRemaining();
      if (value != null) setRemaining(value);
    })();
  }, [isPro]);

  useEffect(() => {
    if (isPro) return;
    let active = true;
    void (async () => {
      const value = await fetchRemaining();
      if (active && value != null) setRemaining(value);
    })();
    return () => {
      active = false;
    };
  }, [isPro]);

  return {
    remaining,
    canGenerate: isPro || remaining > 0,
    refresh,
  };
}
