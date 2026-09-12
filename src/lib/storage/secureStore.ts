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

