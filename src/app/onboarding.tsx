import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomBar } from '@/components/bottom-bar';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/store/settings';

interface Step {
  icon: IconName;
  title: string;
  body: string;
}

const STEPS: readonly Step[] = [
  {
    icon: 'sparkle',
    title: 'Learn words in context',
    body: 'Drop in words or a topic — Repaso turns them into real sentences with translations.',
  },
  {
    icon: 'microphone',
    title: 'Type, speak, or snap',
    body: 'Add vocabulary by typing, recording your voice, or taking a photo.',
  },
  {
    icon: 'refresh',
    title: 'Remember with repetition',
    body: 'We remind you to review at just the right time, so it actually sticks.',
  },
];

const ICON_TILE = 132;

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setOnboarded = useSettings((s) => s.setOnboarded);

  const [index, setIndex] = useState(0);
  const last = index === STEPS.length - 1;
  const step = STEPS[index];

  function finish() {
    setOnboarded(true);
    router.replace('/');
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <BrandMark size={34} />
        <ThemedText type="h2">Repaso</ThemedText>
      </View>

      <View style={styles.body}>
        <View
          style={[
            styles.tile,
            { backgroundColor: theme.brandSofter, borderColor: theme.brandSoft },
          ]}>
          <Icon name={step.icon} size={60} color={theme.brand} />
        </View>
        <ThemedText type="h1" style={styles.title}>
          {step.title}
        </ThemedText>
        <ThemedText type="bodyLg" themeColor="textSecondary" style={styles.text}>
          {step.body}
        </ThemedText>
      </View>

      <View style={styles.dots}>
        {STEPS.map((_, n) => (
          <View
            key={n}
            style={[
              styles.dot,
              {
                width: n === index ? 22 : 7,
                backgroundColor: n === index ? theme.brand : theme.borderStrong,
              },
            ]}
          />
        ))}
      </View>

      <BottomBar>
        <Button
          variant="primary"
          size="lg"
          block
          title={last ? 'Start learning' : 'Next'}
          trailingIcon={last ? 'check' : 'arrow-right'}
          onPress={() => (last ? finish() : setIndex(index + 1))}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          onPress={finish}
          style={styles.skip}>
          <ThemedText type="smBold" themeColor="textMuted">
            Skip
          </ThemedText>
        </Pressable>
      </BottomBar>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.xxl,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  tile: {
    width: ICON_TILE,
    height: ICON_TILE,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: { textAlign: 'center', marginBottom: Spacing.md, maxWidth: 290 },
  text: { textAlign: 'center', maxWidth: 300 },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: Spacing.sm },
  dot: { height: 7, borderRadius: Radius.pill },
  skip: { alignSelf: 'center', paddingVertical: Spacing.md },
});
