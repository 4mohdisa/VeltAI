// Supabase realtime seam for async scan status updates.
//
// BLOCKED: @supabase/supabase-js is not installed and the app has no
// SUPABASE_URL / anon key configured, so this is a documented no-op today — it
// wires cleanly at every call site and returns an unsubscribe, so activating
// realtime later is a single-file change here (construct a client, open a
// channel on food_logs filtered by user_id, forward UPDATE payloads to onUpdate).
//
// The scan flow does not depend on this: the app models analyzing→ready→confirmed
// locally (capture-first), so scanning works fully offline without realtime.

export type FoodLogRealtimeUpdate = {
  id: string;
  status?: string;
  [key: string]: unknown;
};

export type Unsubscribe = () => void;

/**
 * Subscribe to server-side food_logs changes for a user. Returns an unsubscribe.
 * No-op until Supabase realtime is configured (see file header).
 */
export function subscribeToFoodLogStatus(
  userId: string | null,
  _onUpdate: (update: FoodLogRealtimeUpdate) => void,
): Unsubscribe {
  if (__DEV__ && userId) {
    console.warn('[realtime] Supabase realtime not configured — scan status updates run locally only.');
  }
  return () => {};
}
