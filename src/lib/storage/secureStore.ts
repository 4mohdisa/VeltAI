// Thin wrapper over expo-secure-store (Keychain-backed) for tokens & small flags.
// Never store large/non-sensitive cache here — use a cache store for that.
import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  hasCompletedOnboarding: 'lume.hasCompletedOnboarding',
  // One-time capture tips (Phase C) — dismissed once, remembered forever.
  forkPromptDismissed: 'lume.forkPromptDismissed',
  labelPromptDismissed: 'lume.labelPromptDismissed',
  // Analytics opt-out ('0' = opted out). Persisted so the privacy choice
  // survives restarts AND sign-outs — the in-memory settings store does not.
  analyticsEnabled: 'lume.analyticsEnabled',
  // Reminders priming sheet: the answer ('granted', 'denied' or 'not_now'). Kept
  // across sign-outs, like the system permission it stands in front of.
  notificationPrimingAnswer: 'lume.notificationPrimingAnswer',
  // Per-category notification switches, quiet hours and the promotional opt in
  // (JSON). Cleared on sign-out so one account's opt in never carries over.
  notificationSettings: 'lume.notificationSettings',
  // The local day (YYYY-MM-DD) reminders were last scheduled for. Cleared on
  // sign-out so the next account reschedules.
  notificationDayKey: 'lume.notificationDayKey',
  // The registered device push token and platform (JSON). Not in the sign-out
  // key list: removePushToken deletes it only after the server removed the token.
  pushToken: 'lume.pushToken',
} as const;

export async function getItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

/** Returns false when the write did not land. Callers storing a throwaway flag
 *  can ignore that; anything that must survive a restart (the offline queue)
 *  has to know, because a swallowed failure looks exactly like a success. */
export async function setItem(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch {
    // Still best-effort for non-critical flags — but no longer silent.
    return false;
  }
}

export async function deleteItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

export async function getHasCompletedOnboarding(): Promise<boolean> {
  const value = await getItem(STORAGE_KEYS.hasCompletedOnboarding);
  return value === 'true';
}

export async function setHasCompletedOnboarding(value: boolean): Promise<void> {
  await setItem(STORAGE_KEYS.hasCompletedOnboarding, value ? 'true' : 'false');
}

