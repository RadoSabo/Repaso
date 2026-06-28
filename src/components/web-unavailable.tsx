/**
 * Shown for every app route on the web build. Repaso is a mobile-only app
 * (iOS + Android); the deployed site exists only to serve the API routes and the
 * Terms / Privacy pages, so the app UI itself is intentionally not available on
 * web. This is the one deliberate web branch, used precisely to disable web.
 */
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { PRIVACY_URL, TERMS_URL } from '@/lib/config';

export function WebUnavailable() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Repaso</Text>
        <Text style={styles.body}>
          Repaso is a flashcard app for iOS and Android. There is no web version.
        </Text>
        <View style={styles.links}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open Terms of Use"
            onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.link}>Terms of Use</Text>
          </Pressable>
          <Text style={styles.dot}>·</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open Privacy Policy"
            onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#ffffff' },
  card: { maxWidth: 420, alignItems: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#11181C' },
  body: { fontSize: 16, lineHeight: 24, color: '#60646C', textAlign: 'center' },
  links: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  link: { fontSize: 14, color: '#208AEF' },
  dot: { fontSize: 14, color: '#60646C' },
});
