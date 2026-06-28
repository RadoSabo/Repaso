/**
 * Local review reminders via expo-notifications. The app schedules a one-off
 * local notification for when a deck becomes due again. No remote/push setup is
 * needed — these fire on-device. Requires a dev/standalone build (not Expo Go).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import i18n from '@/i18n';

const ANDROID_CHANNEL = 'reviews';

// Show reminders as banners even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: i18n.t('notifications.channelName'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Schedules a one-off reminder for `deckName` at `fireAtSec` (unix seconds).
 * Returns the notification id (to cancel later), or null if it couldn't be
 * scheduled (permission denied, or the time is already in the past).
 */
export async function scheduleDeckReminder(
  deckName: string,
  fireAtSec: number
): Promise<string | null> {
  try {
    if (fireAtSec * 1000 <= Date.now()) return null;
    if (!(await ensurePermission())) return null;
    await ensureAndroidChannel();

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.reminderTitle'),
        body: i18n.t('notifications.reminderBody', { deck: deckName }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAtSec * 1000),
        channelId: ANDROID_CHANNEL,
      },
    });
  } catch {
    return null;
  }
}

/** Cancels a previously scheduled reminder, if any. */
export async function cancelReminder(id: string | null | undefined): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already fired or removed — ignore
  }
}
