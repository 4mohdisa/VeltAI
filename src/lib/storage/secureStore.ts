// Thin wrapper over expo-secure-store (Keychain-backed) for tokens & small flags.
// Never store large/non-sensitive cache here — use a cache store for that.
import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  hasCompletedOnboarding: 'veltai.hasCompletedOnboarding',
} as const;

export async function getItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // swallow — storage is best-effort for non-critical flags
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

