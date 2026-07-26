// Sign-out purge — asserts NO store retains user data after resetAllStores()
// (Phase 13 C4), including the persisted offline queue.
import { resetAllStores } from '@/lib/auth/resetRegistry';
import { useFoodStore } from '@/lib/data/foodStore';
import { useGymStore } from '@/lib/data/gymStore';
import { useUserStore } from '@/lib/data/userStore';
import { useSettingsStore } from '@/lib/settings/store';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { enqueue, loadQueue, pendingCount } from '@/lib/offline/queue';
import { getItem } from '@/lib/storage/secureStore';

test('sign-out clears every store, the offline queue, and persisted keys', async () => {
  // Dirty every store with user data.
  useFoodStore.getState().logMeal('Lunch', { name: 'Secret meal', quantityG: 100, calories: 500, protein: 1, carbs: 1, fat: 1 }, 'manual');
  useGymStore.getState().logGymSession({ durationMin: 45 });
  useUserStore.getState().setProfile({ name: 'Private Person' });
  useSettingsStore.getState().setCustomGoals({ calories: 1234 });
  useSettingsStore.getState().setGoalMode('custom');
  useOnboardingStore.getState().setGoal('muscle');
  useOnboardingStore.getState().setMeasurements({ age: 41, weight_kg: 90 });
  await enqueue('/api/food/logs', { food_name: 'Queued' });

  await resetAllStores();

  // Food/gym back to seed — the dirtied entries are gone.
  const foods = useFoodStore.getState();
  expect(JSON.stringify(foods.meals)).not.toContain('Secret meal');
  const gym = useGymStore.getState();
  expect(gym.streak.gymLoggedToday).toBe(false);
  // Profile + settings back to defaults.
  expect(useUserStore.getState().profile.name).not.toBe('Private Person');
  expect(useSettingsStore.getState().goalMode).toBe('ai');
  expect(useSettingsStore.getState().customGoals.calories).not.toBe(1234);
  // Onboarding answers wiped.
  expect(useOnboardingStore.getState().goal).toBeNull();
  expect(useOnboardingStore.getState().age).toBeNull();
  // Offline queue drained (in-memory + persisted).
  expect(pendingCount()).toBe(0);
  await loadQueue();
  expect(pendingCount()).toBe(0);
  // Persisted onboarding key removed.
  expect(await getItem('lumo.onboarding')).toBeNull();
});

test('every store exposes a reset path (regression guard)', () => {
  expect(typeof useFoodStore.getState().reset).toBe('function');
  expect(typeof useGymStore.getState().reset).toBe('function');
  expect(typeof useUserStore.getState().resetProfile).toBe('function');
  expect(typeof useSettingsStore.getState().reset).toBe('function');
  expect(typeof useOnboardingStore.getState().reset).toBe('function');
});
