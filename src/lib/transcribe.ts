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

import { PROXY_URL } from './config';
import { getAppUserId } from './revenuecat';

export class TranscriptionError extends Error {
  /** True when the server requires Repaso Pro — route to the paywall. */
  readonly paywall: boolean;
  constructor(message: string, options?: { paywall?: boolean }) {
    super(message);
    this.paywall = options?.paywall ?? false;
  }
}

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
    throw new TranscriptionError('Could not read the recording. Try again.');
  }

  const appUserId = await getAppUserId().catch(() => '');

  let res: Response;
  try {
    res = await fetch(`${PROXY_URL}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType: 'audio/m4a', appUserId }),
    });
  } catch (e) {
    console.warn('[transcribe] upload failed', { uri, error: e });
    throw new TranscriptionError('Could not reach the transcription server. Check your connection.');
  }

  if (!res.ok) {
    if (res.status === 402) {
      throw new TranscriptionError('Repaso Pro is required for voice input.', { paywall: true });
    }
    if (res.status === 429) {
      throw new TranscriptionError('Rate limited. Please wait a moment and try again.');
    }
    const detail = await res.text().catch(() => '');
    throw new TranscriptionError(detail || `Transcription failed (HTTP ${res.status}).`);
  }

  const data = (await res.json().catch(() => null)) as { text?: string } | null;
  return (data?.text ?? '').trim();
}
