// Sign-out purge — one function that clears EVERY piece of client state: all
// zustand stores, persisted secure-store keys, and the offline queue. The auth
// machine's `purgeAllState` effect calls this; tests assert nothing survives.
import { useFoodStore } from '@/lib/data/foodStore';
import { useGymStore } from '@/lib/data/gymStore';
import { useUserStore } from '@/lib/data/userStore';
import { useSettingsStore } from '@/lib/settings/store';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { useToastStore } from '@/components/display/toastStore';
import { deleteItem, setHasCompletedOnboarding } from '@/lib/storage/secureStore';
import { resetAnalytics } from '@/lib/analytics';
import { AI_CONSENT_KEY, __resetAiConsentCache } from '@/lib/ai/consent';
import { __resetForTests as resetOfflineQueue } from '@/lib/offline/queue';

// Persisted secure-store keys owned by the app (beyond the zustand-persist ones).
const SECURE_KEYS = ['lume.onboarding', 'lume.offline.queue', 'forkPromptDismissed', 'labelPromptDismissed', AI_CONSENT_KEY];

/** Clear every store, persisted key, and the offline queue. Never throws. */
export async function resetAllStores(): Promise<void> {
  // Zustand stores — every one has a reset (asserted by test).
  useFoodStore.getState().reset();
  useGymStore.getState().reset();
  useUserStore.getState().resetProfile();
  useSettingsStore.getState().reset();
  useOnboardingStore.getState().reset();
  useToastStore.getState().dismiss();

  // Offline queue (in-memory + persisted).
  await resetOfflineQueue().catch(() => {});

  // Analytics buffer (in-memory + persisted) — unsent events must never be
  // attributed to the next account on this device.
  await resetAnalytics().catch(() => {});

  // Persisted flags/keys.
  await setHasCompletedOnboarding(false).catch(() => {});
  for (const key of SECURE_KEYS) {
    await deleteItem(key).catch(() => {});
  }
  __resetAiConsentCache(); // the next account re-acknowledges AI processing
}
