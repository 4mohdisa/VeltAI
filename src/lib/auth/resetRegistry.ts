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
import { __resetForTests as resetOfflineQueue } from '@/lib/offline/queue';

// Persisted secure-store keys owned by the app (beyond the zustand-persist ones).
const SECURE_KEYS = ['lumo.onboarding', 'lumo.offline.queue', 'forkPromptDismissed', 'labelPromptDismissed'];

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

  // Persisted flags/keys.
  await setHasCompletedOnboarding(false).catch(() => {});
  for (const key of SECURE_KEYS) {
    await deleteItem(key).catch(() => {});
  }
}
