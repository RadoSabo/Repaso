import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { initDatabase } from '@/db/client';
import { useResolvedScheme } from '@/hooks/use-theme';

export default function RootLayout() {
  // Bootstrap the SQLite schema once, synchronously, before first render.
  useState(() => {
    initDatabase();
    return true;
  });

  const scheme = useResolvedScheme();
  const theme = Colors[scheme];

  const screenOptions = {
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.tint,
    headerTitleStyle: { color: theme.text },
    contentStyle: { backgroundColor: theme.background },
  } as const;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={screenOptions}>
            <Stack.Screen name="index" options={{ title: 'Repaso' }} />
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
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          </Stack>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
