// Data-access layer — the single seam between screens and data. Screens import
// from here (never from @/lib/mock directly). Reads = hooks ({ data, isLoading,
// error, refetch }); writes = imperative mutation functions; scan = async mocks.
export * from './hooks';
export * from './mutations';
export * from './scan';
export type { StoredMeal, StoredFoodItem, NewFoodItem } from './foodStore';
export type { Streak } from './gymStore';
export type { UserProfile } from './userStore';
