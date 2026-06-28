/**
 * Drives the paywall screen: loads the current RevenueCat offering and runs
 * purchase / restore. Keeps `paywall.tsx` presentational (logic lives here).
 */
import { useCallback, useEffect, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';

import i18n from '@/i18n';
import { getProOffering, purchasePackage, restorePurchases } from '@/lib/revenuecat';

export interface Paywall {
  /** Purchasable packages from the current offering (e.g. monthly, annual). */
  packages: PurchasesPackage[];
  /** Loading the offering. */
  loading: boolean;
  /** A purchase or restore is in flight. */
  busy: boolean;
  error: string | null;
  /** Purchase a package; resolves to whether Pro is now active. */
  buy: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore prior purchases; resolves to whether Pro is now active. */
  restore: () => Promise<boolean>;
}

export function usePaywall(): Paywall {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const offering = await getProOffering();
        if (active) setPackages(offering?.availablePackages ?? []);
      } catch {
        if (active) setError(i18n.t('paywall.loadFailed'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const buy = useCallback(async (pkg: PurchasesPackage) => {
    setError(null);
    setBusy(true);
    try {
      return await purchasePackage(pkg);
    } catch (e) {
      // A user-cancelled purchase is not an error to surface.
      if (!(e as { userCancelled?: boolean })?.userCancelled) {
        setError(i18n.t('paywall.purchaseFailed'));
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      return await restorePurchases();
    } catch {
      setError(i18n.t('paywall.restoreFailed'));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return { packages, loading, busy, error, buy, restore };
}
