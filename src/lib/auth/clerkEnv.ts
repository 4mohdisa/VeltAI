// Clerk environment: key detection + the expo-secure-store token cache.
//
// The publishable key comes from EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. When it is
// absent the app runs in "local dev auth mode": ClerkProvider is not mounted,
// the auth machine treats the user as a local dev session, and everything stays
// navigable in Expo Go. One warning, once.
import { getItem, setItem } from '@/lib/storage/secureStore';

export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

let warned = false;

/** True when a Clerk publishable key is configured. */
export function isClerkEnabled(): boolean {
  const enabled = CLERK_PUBLISHABLE_KEY.length > 0;
  if (!enabled && !warned) {
    warned = true;
    console.warn('Clerk key absent — running in local dev auth mode.');
  }
  return enabled;
}

/** Clerk's documented tokenCache contract, backed by the app's secure-store
 *  wrappers. Errors degrade to cache-miss (Clerk refetches). */
export const clerkTokenCache = {
  getToken: (key: string): Promise<string | null> => getItem(key).catch(() => null),
  saveToken: (key: string, value: string): Promise<void> => setItem(key, value).catch(() => undefined),
};
