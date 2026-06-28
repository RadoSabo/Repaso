/**
 * RevenueCat integration — the only file that talks to the Purchases SDK.
 *
 * It owns three things:
 *  - configuring the SDK once at launch (`configureRevenueCat`),
 *  - a tiny reactive store of "is the `unlimited` entitlement active?" that
 *    `useEntitlement` subscribes to (kept in sync via the SDK's customer-info
 *    listener), and
 *  - thin purchase/restore/offering helpers the paywall (Phase 4) calls.
 *
 * Screens never import `react-native-purchases` directly — they read `isPro`
 * from `useEntitlement` and call these helpers. The client flag only governs
 * what the UI offers; the proxy routes remain the real server-side gate.
 */
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { PRO_ENTITLEMENT_ID as ENTITLEMENT_ID } from './limits';

/**
 * Public SDK key. iOS/Android each need their own platform key in release
 * builds; in dev a single RevenueCat Test Store key (`test_…`) works for both,
 * so we fall back to it when no platform-specific key is set. RevenueCat crashes
 * a *release* build configured with a Test Store key — production must set the
 * `appl_`/`goog_` keys.
 */
const API_KEY =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_KEY_IOS,
    android: process.env.EXPO_PUBLIC_REVENUECAT_KEY_ANDROID,
  }) || process.env.EXPO_PUBLIC_REVENUECAT_KEY;

// --- Reactive entitlement store (consumed by useEntitlement) ---------------

let customerInfo: CustomerInfo | null = null;
const listeners = new Set<() => void>();

function setCustomerInfo(info: CustomerInfo) {
  customerInfo = info;
  for (const notify of listeners) notify();
}

/** Subscribe to entitlement changes. Returns an unsubscribe fn. */
export function subscribeEntitlement(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Snapshot for `useSyncExternalStore`: is Pro currently active? */
export function hasUnlimitedEntitlement(): boolean {
  return customerInfo?.entitlements.active[ENTITLEMENT_ID] != null;
}

// --- Lifecycle -------------------------------------------------------------

/**
 * Configure the SDK once at app launch. No-ops when no key is set (e.g. a local
 * run without env) so the app still boots; without configuration the entitlement
 * store stays empty, i.e. not Pro.
 */
export function configureRevenueCat(): void {
  if (!API_KEY) return;
  Purchases.configure({ apiKey: API_KEY });
  Purchases.addCustomerInfoUpdateListener(setCustomerInfo);
  // Prime the store so the first entitlement read reflects the cached state.
  Purchases.getCustomerInfo().then(setCustomerInfo).catch(() => {});
}

// --- Helpers for the paywall ----------------------------------------------

/** The current offering (its packages carry the localized prices). */
export async function getProOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

/** Purchase a package; resolves to whether Pro is now active. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo: info } = await Purchases.purchasePackage(pkg);
  return info.entitlements.active[ENTITLEMENT_ID] != null;
}

/** Restore prior purchases (Apple-required); resolves to whether Pro is active. */
export async function restorePurchases(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return info.entitlements.active[ENTITLEMENT_ID] != null;
}

/**
 * The anonymous RevenueCat app-user-ID, sent to the Pro-only proxy routes so the
 * server can confirm the entitlement before spending on OpenAI (Phase 3).
 */
export function getAppUserId(): Promise<string> {
  return Purchases.getAppUserID();
}
