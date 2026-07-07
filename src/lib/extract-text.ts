/**
 * Client for the image text-extraction proxy (see `app/api/extract-text+api.ts`).
 *
 * Image is an *input method*, not a separate generation path: the proxy reads the
 * text visible in the photo (a page, menu, sign, worksheet) with a multimodal
 * model, the text is shown in the input field for the user to confirm, and then
 * the normal card generation runs on it.
 */

import { postToProxy, ProxyError } from './proxy-request';
import { getAppUserId } from './revenuecat';

/** `paywall` is true when the server requires Repaso Pro — route to the paywall. */
export class ImageTextError extends ProxyError {}

export interface ExtractTextOptions {
  /** Base64-encoded image data (no data-URL prefix), from expo-image-picker. */
  base64: string;
  /** The picked asset's MIME type, e.g. "image/jpeg"; defaults to JPEG. */
  mimeType?: string;
}

/** Sends an image to the proxy and returns the text the model read from it. */
export async function extractTextFromImage({ base64, mimeType }: ExtractTextOptions): Promise<string> {
  const appUserId = await getAppUserId().catch(() => '');

  const data = await postToProxy<{ text?: string }>({
    path: '/api/extract-text',
    body: { imageBase64: base64, mimeType: mimeType ?? 'image/jpeg', appUserId },
    error: ImageTextError,
    cannotReachKey: 'extract.cannotReach',
    paywallKey: 'extract.proRequired',
    rateLimitedKey: 'extract.rateLimited',
    failedKey: 'extract.failed',
  });

  return (data?.text ?? '').trim();
}
