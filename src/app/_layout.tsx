import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { WebUnavailable } from '@/components/web-unavailable';
import { Colors, FontFamily } from '@/constants/theme';
import { initDatabase } from '@/db/client';
import { useResolvedScheme } from '@/hooks/use-theme';
import '@/i18n';
import { isSupportedLanguage, resolveDeviceLanguage } from '@/i18n/languages';
import { configureRevenueCat } from '@/lib/revenuecat';
import { useSettings } from '@/store/settings';

SplashScreen.preventAutoHideAsync();

// Repaso is mobile-only. The deployed web build serves just the API routes and
// the Terms / Privacy pages (all `+api.ts` handlers, which run outside this React
// tree); every app screen is replaced by a notice. Native runs the real app.
export default function RootLayout() {
  return Platform.OS === 'web' ? <WebUnavailable /> : <NativeRoot />;
}

function NativeRoot() {
  // Bootstrap the SQLite schema and the Purchases SDK once, before first render.
  useState(() => {
    initDatabase();
    configureRevenueCat();
    return true;
  });

  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    DMMono_400Regular,
    DMMono_500Medium,
  });
  const hydrated = useSettings((s) => s.hydrated);
  const languagePreference = useSettings((s) => s.languagePreference);

  // `useTranslation` both subscribes this component to language changes and gives
  // us `t` for the navigation titles below.
  const { t, i18n } = useTranslation();

  // The user's saved language, falling back to the phone language for any legacy
  // or unrecognized preference (e.g. the removed "system" value).
  const [deviceLanguage] = useState(resolveDeviceLanguage);
  const uiLanguage = isSupportedLanguage(languagePreference) ? languagePreference : deviceLanguage;
  useEffect(() => {
    if (i18n.language !== uiLanguage) i18n.changeLanguage(uiLanguage);
  }, [i18n, uiLanguage]);

  const scheme = useResolvedScheme();
  const theme = Colors[scheme];

  // Hold the splash until fonts are in, persisted settings have hydrated, and the
  // active UI language matches the resolved preference — so the first painted
  // frame is fully correct, with no theme or language flash. `changeLanguage`
  // applies synchronously (resources are bundled), re-rendering via `useTranslation`.
  const ready = fontsLoaded && hydrated && i18n.language === uiLanguage;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const screenOptions = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.brand,
    headerTitleStyle: { color: theme.text, fontFamily: FontFamily.display, fontSize: 19 },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.bg },
  } as const;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider
          value={{
            ...navTheme,
            colors: {
              ...navTheme.colors,
              background: theme.bg,
              card: theme.bg,
              text: theme.text,
              border: theme.borderSubtle,
              primary: theme.brand,
            },
          }}>
          <Stack screenOptions={screenOptions}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="deck/[id]/index" options={{ title: t('nav.deck') }} />
            <Stack.Screen name="deck/[id]/review" options={{ title: t('nav.review') }} />
            <Stack.Screen name="deck/new" options={{ title: t('nav.newDeck'), presentation: 'modal' }} />
            <Stack.Screen
              name="deck/[id]/edit"
              options={{ title: t('nav.editDeck'), presentation: 'modal' }}
            />
            <Stack.Screen name="card/new" options={{ title: t('nav.addCard'), presentation: 'modal' }} />
            <Stack.Screen name="card/[id]" options={{ title: t('nav.editCard'), presentation: 'modal' }} />
            <Stack.Screen
              name="generate"
              options={{ title: t('nav.generate'), presentation: 'modal' }}
            />
            <Stack.Screen name="paywall" options={{ title: t('nav.pro'), presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ title: t('nav.settings') }} />
          </Stack>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
