// The only file that asks expo-notifications for permission. Call it from the
// priming screen's "Turn on reminders" only, never before the user has seen it.
import * as Notifications from 'expo-notifications';

export type PermissionResult = 'granted' | 'denied';

/** Shows the system prompt (iOS asks once; later calls return the saved answer). */
export async function requestNotificationPermission(): Promise<PermissionResult> {
  try {
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}
