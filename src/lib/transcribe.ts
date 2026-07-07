/**
 * Client for the speech-to-text proxy (see `app/api/transcribe+api.ts`).
 *
 * Voice is an *input method*, not a separate generation path: the recorded audio
 * is transcribed to text here, the text is shown in the input field for the user
 * to confirm, and then the normal card generation runs on it.
 *
 * The audio is sent as base64 in a JSON body rather than multipart/form-data:
 * React Native's New Architecture fetch rejects the legacy `{ uri }` FormData
 * file part ("Unsupported FormDataPart implementation"). The server rebuilds the
 * multipart request to OpenAI.
 */

import { File } from 'expo-file-system';

import i18n from '@/i18n';
import { postToProxy, ProxyError } from './proxy-request';
import { getAppUserId } from './revenuecat';

/** `paywall` is true when the server requires Repaso Pro — route to the paywall. */
export class TranscriptionError extends ProxyError {}

/**
 * Reads a recorded audio file (by local URI) and uploads it to the proxy,
 * returning the transcribed text.
 */
export async function transcribeAudio(uri: string): Promise<string> {
  let audioBase64: string;
  try {
    audioBase64 = await new File(uri).base64();
  } catch (e) {
    console.warn('[transcribe] could not read recording', { uri, error: e });
    throw new TranscriptionError(i18n.t('transcribe.cannotRead'));
  }

  const appUserId = await getAppUserId().catch(() => '');

  const data = await postToProxy<{ text?: string }>({
    path: '/api/transcribe',
    body: { audioBase64, mimeType: 'audio/m4a', appUserId },
    error: TranscriptionError,
    cannotReachKey: 'transcribe.cannotReach',
    paywallKey: 'transcribe.proRequired',
    rateLimitedKey: 'transcribe.rateLimited',
    failedKey: 'transcribe.failed',
  });

  return (data?.text ?? '').trim();
}
