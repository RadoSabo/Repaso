import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';

import { Badge } from '@/components/badge';
import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, SparkGradient, Spacing } from '@/constants/theme';
import { usePaywall } from '@/hooks/use-paywall';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { PRIVACY_URL, TERMS_URL } from '@/lib/config';

interface Benefit {
  icon: IconName;
  title: string;
  body: string;
}

const BENEFITS: readonly Benefit[] = [
  {
    icon: 'sparkle',
    title: 'Generate from any topic',
    body: 'Type a word list or describe a subject — get a full deck in seconds.',
  },
  {
    icon: 'camera',
    title: 'Snap a photo or speak it',
    body: 'Turn a textbook page or your voice straight into flashcards.',
  },
  {
    icon: 'infinity',
    title: 'Unlimited generations',
    body: 'No daily caps. Build as many decks as you need.',
  },
];

const HERO_TILE = 74;

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
  const shadows = useShadows();
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

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.closeRow, { paddingTop: insets.top + Spacing.sm }]}>
        <IconButton icon="x" variant="soft" label="Close" onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LinearGradient
            colors={SparkGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroTile, shadows.spark]}>
            <Icon name="sparkle" size={38} color="#fff" />
          </LinearGradient>
          <Badge tone="brand" icon="crown">
            Repaso Pro
          </Badge>
          <ThemedText type="h1" style={styles.heroTitle}>
            Generate decks with AI
          </ThemedText>
          <ThemedText type="bodyLg" themeColor="textSecondary" style={styles.heroSub}>
            Stop typing cards by hand. Turn any topic, photo, or word list into a ready-to-study deck.
          </ThemedText>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefitRow}>
              <View style={[styles.benefitTile, { backgroundColor: theme.brandSoft }]}>
                <Icon name={b.icon} size={21} color={theme.brand} />
              </View>
              <View style={styles.benefitText}>
                <ThemedText type="h3">{b.title}</ThemedText>
                <ThemedText type="sm" themeColor="textSecondary">
                  {b.body}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.brand} style={styles.loader} />
        ) : packages.length === 0 ? (
          <ThemedText type="sm" themeColor="textMuted">
            Subscription options are unavailable right now. Please try again later.
          </ThemedText>
        ) : null}
      </ScrollView>

      <BottomBar>
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
                styles.plan,
                {
                  borderColor: isActive ? theme.brand : theme.border,
                  backgroundColor: isActive ? theme.brandSofter : theme.surface,
                },
              ]}>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isActive ? theme.brand : theme.borderStrong,
                    borderWidth: isActive ? 6 : 2,
                  },
                ]}
              />
              <View style={styles.planText}>
                <View style={styles.planTitleRow}>
                  <ThemedText type="bodyBold">{title}</ThemedText>
                  {badge ? (
                    <Badge tone="brand" size="sm">
                      {badge}
                    </Badge>
                  ) : null}
                </View>
              </View>
              <ThemedText type="bodyBold">
                {pkg.product.priceString}
                <ThemedText type="sm" themeColor="textMuted">
                  {suffix}
                </ThemedText>
              </ThemedText>
            </Pressable>
          );
        })}

        {error ? (
          <ThemedText type="sm" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}

        <Button
          title={
            active
              ? `Unlock Pro — ${active.product.priceString}${describePackage(active).suffix}`
              : 'Unlock Pro'
          }
          variant="spark"
          size="lg"
          block
          leadingIcon="lock-open"
          loading={busy}
          disabled={!active || loading}
          onPress={handleSubscribe}
        />

        <View style={styles.assurance}>
          <Icon name="shield-check" size={15} color={theme.success} />
          <ThemedText type="sm" themeColor="textMuted">
            Cancel anytime
          </ThemedText>
        </View>

        <View style={styles.links}>
          <Pressable accessibilityRole="button" accessibilityLabel="Restore purchases" disabled={busy} onPress={handleRestore}>
            <ThemedText type="smBold" themeColor="textMuted">
              Restore purchase
            </ThemedText>
          </Pressable>
          <ThemedText type="sm" themeColor="textMuted">
            ·
          </ThemedText>
          <Pressable accessibilityRole="link" accessibilityLabel="Open Terms of Use" onPress={() => Linking.openURL(TERMS_URL)}>
            <ThemedText type="smBold" themeColor="textMuted">
              Terms
            </ThemedText>
          </Pressable>
          <ThemedText type="sm" themeColor="textMuted">
            ·
          </ThemedText>
          <Pressable accessibilityRole="link" accessibilityLabel="Open Privacy Policy" onPress={() => Linking.openURL(PRIVACY_URL)}>
            <ThemedText type="smBold" themeColor="textMuted">
              Privacy
            </ThemedText>
          </Pressable>
        </View>
      </BottomBar>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.md },
  content: { paddingHorizontal: Spacing.gutter, paddingBottom: Spacing.lg, gap: Spacing.xl },
  hero: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xs },
  heroTile: {
    width: HERO_TILE,
    height: HERO_TILE,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { textAlign: 'center' },
  heroSub: { textAlign: 'center', maxWidth: 320 },
  benefits: { gap: Spacing.lg },
  benefitRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  benefitTile: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1, gap: 2 },
  loader: { marginVertical: Spacing.xxl },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
  },
  radio: { width: 22, height: 22, borderRadius: 11 },
  planText: { flex: 1 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  assurance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm - 1 },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
});
