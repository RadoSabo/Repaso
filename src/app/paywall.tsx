import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePaywall } from '@/hooks/use-paywall';
import { useTheme } from '@/hooks/use-theme';
import { PRIVACY_URL, TERMS_URL } from '@/lib/config';

const BENEFITS = [
  'Unlimited deck generations',
  'Turn your voice into cards',
  'Turn photos into cards',
] as const;

const CHECK_ICON_SIZE = 20;

/** Human label + price suffix for a package, derived from its type. */
function describePackage(pkg: PurchasesPackage): { title: string; suffix: string; badge?: string } {
  switch (pkg.packageType) {
    case 'ANNUAL':
      return { title: 'Annual', suffix: '/year', badge: '2 months free' };
    case 'MONTHLY':
      return { title: 'Monthly', suffix: '/month' };
    default:
      return { title: pkg.product.title, suffix: '' };
  }
}

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { packages, loading, busy, error, buy, restore } = usePaywall();

  // Default to the annual package (best value) until the user picks one.
  const defaultPkg = packages.find((p) => p.packageType === 'ANNUAL') ?? packages[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const active = packages.find((p) => p.identifier === selectedId) ?? defaultPkg;

  async function handleSubscribe() {
    if (!active) return;
    if (await buy(active)) router.back();
  }

  async function handleRestore() {
    if (await restore()) router.back();
  }

  const insetStyle = { paddingBottom: insets.bottom + Spacing.three };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Unlimited deck generations</ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          Go unlimited — and help keep Repaso alive.
        </ThemedText>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={CHECK_ICON_SIZE} color={theme.success} />
              <ThemedText type="default">{benefit}</ThemedText>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.tint} style={styles.loader} />
        ) : packages.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Subscription options are unavailable right now. Please try again later.
          </ThemedText>
        ) : (
          <View style={styles.packages}>
            {packages.map((pkg) => {
              const { title, suffix, badge } = describePackage(pkg);
              const isActive = active?.identifier === pkg.identifier;
              return (
                <Pressable
                  key={pkg.identifier}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${title} plan, ${pkg.product.priceString}${suffix}`}
                  onPress={() => setSelectedId(pkg.identifier)}
                  style={[
                    styles.package,
                    {
                      borderColor: isActive ? theme.tint : theme.border,
                      backgroundColor: isActive ? theme.backgroundSelected : theme.backgroundElement,
                    },
                  ]}>
                  <View style={styles.packageText}>
                    <ThemedText type="smallBold">{title}</ThemedText>
                    {badge ? (
                      <ThemedText type="small" themeColor="success">
                        {badge}
                      </ThemedText>
                    ) : null}
                  </View>
                  <ThemedText type="smallBold">
                    {pkg.product.priceString}
                    <ThemedText type="small" themeColor="textSecondary">
                      {suffix}
                    </ThemedText>
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}

        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}

        <View style={styles.legalRow}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open Terms of Use"
            onPress={() => Linking.openURL(TERMS_URL)}>
            <ThemedText type="small" themeColor="textSecondary">
              Terms
            </ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">
            ·
          </ThemedText>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open Privacy Policy"
            onPress={() => Linking.openURL(PRIVACY_URL)}>
            <ThemedText type="small" themeColor="textSecondary">
              Privacy
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, insetStyle, { borderTopColor: theme.border }]}>
        <Button
          title={active ? `Subscribe — ${active.product.priceString}${describePackage(active).suffix}` : 'Subscribe'}
          loading={busy}
          disabled={!active || loading}
          onPress={handleSubscribe}
        />
        <Button title="Restore Purchases" variant="ghost" disabled={busy} onPress={handleRestore} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  benefits: { gap: Spacing.two, marginTop: Spacing.two },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  loader: { marginVertical: Spacing.four },
  packages: { gap: Spacing.two, marginTop: Spacing.one },
  package: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  packageText: { gap: Spacing.half },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  footer: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
