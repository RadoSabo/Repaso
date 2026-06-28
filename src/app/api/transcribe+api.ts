/**
 * Server-only proxy for speech-to-text (Pro-only input method).
 *
 * The app sends the recording as base64 in a JSON body (the client can't build
 * a multipart file part on React Native's New Architecture). This route decodes
 * it, forwards it to OpenAI's transcription endpoint as multipart, and returns
 * the text — which the app drops into the generation field for the user to
 * confirm. The OpenAI key never leaves the server.
 *   OPENAI_API_KEY        (required)  secret key, server-side only
 *   OPENAI_TRANSCRIBE_MODEL (optional) defaults to "gpt-4o-mini-transcribe"
 *
 * Voice input is Pro-only: this route confirms the caller's RevenueCat
 * `unlimited` entitlement (via `requirePro`) before any OpenAI spend. The client
 * gate is UX only. See docs/plans/mvp-monetization.md.
 */

import { clientIp, json, rateLimited, requirePro } from '@/lib/server-proxy';

const OPENAI_TRANSCRIBE_URL = 'https://api.openai.com/v1/audio/transcriptions';
// A 60s recording is ~1 MB (~1.4M base64 chars); OpenAI accepts up to 25 MB.
const MAX_AUDIO_BASE64_CHARS = 34_000_000;

// `new FormData()` on the server runtime is web-spec, but the ambient React
// Native types ship a stripped 2-arg `append`, so describe the web shape here.
type AppendableFormData = { append(name: string, value: unknown, filename?: string): void };

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is missing OPENAI_API_KEY.' }, 500);
  }

  if (rateLimited(clientIp(request))) {
    return json({ error: 'Too many requests.' }, 429);
  }

  let payload: { audioBase64?: unknown; mimeType?: unknown; appUserId?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const appUserId = typeof payload.appUserId === 'string' ? payload.appUserId : '';
  if (!(await requirePro(appUserId))) {
    return json({ error: 'Repaso Pro required.', code: 'pro_required' }, 402);
  }

  const audioBase64 = typeof payload.audioBase64 === 'string' ? payload.audioBase64 : '';
  const mimeType = typeof payload.mimeType === 'string' ? payload.mimeType : 'audio/m4a';
  if (!audioBase64) {
    return json({ error: 'No audio provided.' }, 400);
  }
  if (audioBase64.length > MAX_AUDIO_BASE64_CHARS) {
    return json({ error: 'Recording is too large.' }, 413);
  }

  let audioBlob: Blob;
  try {
    const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    audioBlob = new Blob([bytes], { type: mimeType });
  } catch {
    return json({ error: 'Could not decode the audio.' }, 400);
  }

  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';
  const upstream = new FormData();
  const appendable = upstream as unknown as AppendableFormData;
  appendable.append('file', audioBlob, 'recording.m4a');
  appendable.append('model', model);
  appendable.append('response_format', 'json');

  let openaiRes: Response;
  try {
    openaiRes = await fetch(OPENAI_TRANSCRIBE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
  } catch {
    return json({ error: 'Failed to reach the model provider.' }, 502);
  }

  if (!openaiRes.ok) {
    console.error('OpenAI transcribe error', openaiRes.status, await openaiRes.text().catch(() => ''));
    return json({ error: 'Transcription failed upstream.' }, 502);
  }

  const result = (await openaiRes.json().catch(() => null)) as { text?: string } | null;
  return json({ text: (result?.text ?? '').trim() });
}
