// Row 10c · ClerkBridge re-registers the push token only once Clerk has loaded a
// signed-in session, and once per session, so the POST never meets a 401 at launch.
import type { ReactElement } from 'react';

import { AppStateProvider } from '@/lib/auth/appState';
import { ClerkBridge } from '@/lib/auth/ClerkBridge';
import { restorePushToken } from '@/lib/notifications/pushToken';
import { act, renderScreen } from './helpers';

jest.mock('@/lib/billing/purchases', () => ({
  onAuthUserChanged: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/notifications/pushToken', () => ({
  restorePushToken: jest.fn(async () => undefined),
}));

const mockAuth = { isLoaded: false, isSignedIn: false, userId: null as string | null };
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ ...mockAuth, getToken: jest.fn(async () => null), signOut: jest.fn() }),
}));

const restore = jest.mocked(restorePushToken);
const app = (): ReactElement => (
  <AppStateProvider>
    <ClerkBridge />
  </AppStateProvider>
);

test('no push token call before sign-in, one after, and none again in the same session', () => {
  const tree = renderScreen(app());
  expect(restore).not.toHaveBeenCalled();

  Object.assign(mockAuth, { isLoaded: true });
  act(() => tree.update(app()));
  expect(restore).not.toHaveBeenCalled();

  Object.assign(mockAuth, { isSignedIn: true, userId: 'user_a' });
  act(() => tree.update(app()));
  act(() => tree.update(app()));
  expect(restore).toHaveBeenCalledTimes(1);
});
