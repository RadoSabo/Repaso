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
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WebUnavailable } from '@/components/web-unavailable';
import { Colors, FontFamily } from '@/constants/theme';
import { initDatabase } from '@/db/client';
import { useResolvedScheme } from '@/hooks/use-theme';
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

  const scheme = useResolvedScheme();
  const theme = Colors[scheme];

  // Hold the splash until fonts are in and persisted settings (theme + onboarding
  // flag) have loaded, so the first painted frame is correct — no flash.
  const ready = fontsLoaded && hydrated;
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
      <SafeAreaProvider>
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
            <Stack.Screen name="deck/[id]/index" options={{ title: 'Deck' }} />
            <Stack.Screen name="deck/[id]/review" options={{ title: 'Review' }} />
            <Stack.Screen name="deck/new" options={{ title: 'New deck', presentation: 'modal' }} />
            <Stack.Screen
              name="deck/[id]/edit"
              options={{ title: 'Edit deck', presentation: 'modal' }}
            />
            <Stack.Screen name="card/new" options={{ title: 'Add card', presentation: 'modal' }} />
            <Stack.Screen name="card/[id]" options={{ title: 'Edit card', presentation: 'modal' }} />
            <Stack.Screen
              name="generate"
              options={{ title: 'Generate cards', presentation: 'modal' }}
            />
            <Stack.Screen name="paywall" options={{ title: 'Repaso Pro', presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          </Stack>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
