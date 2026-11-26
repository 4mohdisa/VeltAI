// Row 10c · Registers this device's push token with the backend once permission
// is granted, and removes it at sign-out. The registered token is also kept in
// secure storage, so a sign-out after a relaunch can still remove it. No call
// throws: a failed request is dropped, so it never blocks the grant or the sign-out.
import { api, type PushTokenInput } from '@/lib/api';
import { deleteItem, getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { getPushToken, notificationPermission } from './device';

let registered: PushTokenInput | null = null;

async function storedPushToken(): Promise<PushTokenInput | null> {
  try {
    const raw = await getItem(STORAGE_KEYS.pushToken);
    return raw ? (JSON.parse(raw) as PushTokenInput) : null;
  } catch {
    return null;
  }
}

/** Sends the device's push token (or the stored one if the device can't give it)
 *  to POST /api/push/token, only when permission is already granted. Never prompts. */
export async function registerPushToken(): Promise<void> {
  if (!(await notificationPermission())) return;
  const input = (await getPushToken()) ?? (await storedPushToken());
  if (!input) return;
  try {
    await api.push.register(input);
    registered = input;
    await setItem(STORAGE_KEYS.pushToken, JSON.stringify(input));
  } catch {
    registered = null;
  }
}

/** Registers again unless this launch already registered, e.g. after a relaunch. */
export async function restorePushToken(): Promise<void> {
  if (!registered) await registerPushToken();
}

/** Removes the token (kept in memory, else stored) with DELETE /api/push/token.
 *  The stored copy is cleared only after the DELETE succeeds. */
export async function removePushToken(): Promise<void> {
  const token = registered?.token ?? (await storedPushToken())?.token;
  registered = null;
  if (!token) return;
  try {
    await api.push.remove(token);
    await deleteItem(STORAGE_KEYS.pushToken);
  } catch {
    // Kept for the next sign-out to try again.
  }
}
