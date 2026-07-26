// zustand `persist` storage adapter backed by expo-secure-store (the app's only
// cross-restart persistence layer — no AsyncStorage is installed). Small values
// only: onboarding answers are a handful of scalars/short arrays, well within
// secure-store's size budget.
import type { StateStorage } from 'zustand/middleware';

import { getItem, setItem, deleteItem } from '@/lib/storage/secureStore';

export const secureStorage: StateStorage = {
  getItem: (name) => getItem(name),
  setItem: (name, value) => setItem(name, value),
  removeItem: (name) => deleteItem(name),
};
