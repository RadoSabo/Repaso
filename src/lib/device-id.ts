/**
 * A stable, reinstall-surviving device identifier used to key the server-side
 * free-generation counter (see `app/api/generate+api.ts`). It is NOT an account
 * and is not linked to the user's identity — just a per-device key so the free
 * allowance survives a reinstall (closing the trivial "reinstall to reset"
 * loophole).
 *
 * - iOS: a UUID generated once and stored in the Keychain via `expo-secure-store`.
 *   The Keychain persists across app uninstalls, so the id is stable.
 * - Android: `ApplicationId`/ANDROID_ID via `expo-application`, which survives
 *   reinstall (resets only on factory reset / per signing key).
 *
 * This is a native iOS/Android branch, not a web branch — allowed by AGENTS.md.
 */
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYCHAIN_KEY = 'repaso.device-id';

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  if (Platform.OS === 'android') {
    const androidId = Application.getAndroidId();
    if (androidId) {
      cached = androidId;
      return androidId;
    }
  }

  // iOS (and the rare Android null): a Keychain-backed UUID, created once.
  const existing = await SecureStore.getItemAsync(KEYCHAIN_KEY);
  if (existing) {
    cached = existing;
    return existing;
  }
  const generated = Crypto.randomUUID();
  await SecureStore.setItemAsync(KEYCHAIN_KEY, generated);
  cached = generated;
  return generated;
}
