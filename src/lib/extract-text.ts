/**
 * Client for the image text-extraction proxy (see `app/api/extract-text+api.ts`).
 *
 * Image is an *input method*, not a separate generation path: the proxy reads the
 * text visible in the photo (a page, menu, sign, worksheet) with a multimodal
 * model, the text is shown in the input field for the user to confirm, and then
 * the normal card generation runs on it.
 */

import { PROXY_URL } from './config';
import { getAppUserId } from './revenuecat';

export class ImageTextError extends Error {
  /** True when the server requires Repaso Pro — route to the paywall. */
  readonly paywall: boolean;
  constructor(message: string, options?: { paywall?: boolean }) {
    super(message);
    this.paywall = options?.paywall ?? false;
  }
}

export interface ExtractTextOptions {
  /** Base64-encoded image data (no data-URL prefix), from expo-image-picker. */
  base64: string;
  /** The picked asset's MIME type, e.g. "image/jpeg"; defaults to JPEG. */
  mimeType?: string;
}

/** Sends an image to the proxy and returns the text the model read from it. */
export async function extractTextFromImage({ base64, mimeType }: ExtractTextOptions): Promise<string> {
  const appUserId = await getAppUserId().catch(() => '');

  let res: Response;
  try {
    res = await fetch(`${PROXY_URL}/api/extract-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType: mimeType ?? 'image/jpeg', appUserId }),
    });
  } catch {
    throw new ImageTextError('Could not reach the image server. Check your connection.');
  }

  if (!res.ok) {
    if (res.status === 402) {
      throw new ImageTextError('Repaso Pro is required for photo input.', { paywall: true });
    }
    if (res.status === 429) {
      throw new ImageTextError('Rate limited. Please wait a moment and try again.');
    }
    const detail = await res.text().catch(() => '');
    throw new ImageTextError(detail || `Reading the image failed (HTTP ${res.status}).`);
  }

  const data = (await res.json().catch(() => null)) as { text?: string } | null;
  return (data?.text ?? '').trim();
}
