// Row 10c · Registers this device's push token with the backend after the user
// grants permission, and removes it at sign-out. Neither call throws: a failed
// request is dropped, so it never blocks the grant or the sign-out.
// ponytail: the token lives in memory only, so after a relaunch sign-out has no
// token to remove until the next grant; persist it if that matters.
import { api } from '@/lib/api';
import { getPushToken } from './device';

let registered: string | null = null;

/** Sends the device's push token to POST /api/push/token and keeps it once saved. */
export async function registerPushToken(): Promise<void> {
  const input = await getPushToken();
  if (!input) return;
  try {
    await api.push.register(input);
    registered = input.token;
  } catch {
    registered = null;
  }
}

/** Removes the kept token with DELETE /api/push/token and forgets it either way. */
export async function removePushToken(): Promise<void> {
  const token = registered;
  if (!token) return;
  registered = null;
  await api.push.remove(token).catch(() => undefined);
}
