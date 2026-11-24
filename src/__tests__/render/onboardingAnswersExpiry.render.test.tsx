// Onboarding answers after an expired session (PHASE4_ROWS.md row 2b). EXECUTES
// the real AppStateProvider and ClerkBridge. When a session cannot be refreshed,
// or Clerk ends it on its own, the user goes to sign in with the session expired
// message and the in-progress onboarding answers survive. A refresh that works
// changes nothing, and a deliberate sign-out still clears them.
import { useEffect, type ReactElement } from 'react';
import { router } from 'expo-router';

import { showToast } from '@/components/display/toastStore';
import { AppStateProvider, useAppState } from '@/lib/auth/appState';
import { ClerkBridge } from '@/lib/auth/ClerkBridge';
import type { AuthEvent } from '@/lib/auth/machine';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, renderScreen } from './helpers';

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

jest.mock('@/components/display/toastStore', () => ({
  ...jest.requireActual('@/components/display/toastStore'),
  showToast: jest.fn(),
}));

jest.mock('@/lib/billing/purchases', () => ({
  onAuthUserChanged: jest.fn().mockResolvedValue(undefined),
}));

const mockGetToken = jest.fn();
const mockSignOut = jest.fn();
const mockAuth = { isLoaded: true, isSignedIn: true, userId: 'user_test' };
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ ...mockAuth, getToken: mockGetToken, signOut: mockSignOut }),
}));

const SIGN_IN = '/onboarding/signup?mode=signin';
const SAVED_STEP = '/onboarding/measurements';

let dispatch!: (event: AuthEvent) => void;
function Probe(): null {
  const { dispatch: appDispatch } = useAppState();
  useEffect(() => {
    dispatch = appDispatch;
  }, [appDispatch]);
  return null;
}

const app = (): ReactElement => (
  <AppStateProvider>
    <ClerkBridge />
    <Probe />
  </AppStateProvider>
);

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function send(event: AuthEvent) {
  act(() => dispatch(event));
  await settle();
}

function expectAnswersKept() {
  const s = useOnboardingStore.getState();
  expect(s.goal).toBe('lose');
  expect(s.age).toBe(30);
  expect(s.last_step).toBe(SAVED_STEP);
}

beforeEach(() => {
  mockAuth.isSignedIn = true;
  mockGetToken.mockReset().mockResolvedValue('token');
  mockSignOut.mockReset().mockImplementation(async () => {
    mockAuth.isSignedIn = false;
  });
  jest.mocked(showToast).mockClear();
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setGoal('lose');
  useOnboardingStore.getState().setMeasurements({ age: 30 });
  useOnboardingStore.getState().setLastStep(SAVED_STEP);
});

test('a refresh failure keeps the answers and sends the user to sign in with the expired message', async () => {
  renderScreen(app());
  await settle();
  await send({ type: 'SIGNED_IN', hasCompletedOnboarding: false });
  mockGetToken.mockResolvedValue(null);

  await send({ type: 'UNAUTHORIZED' });

  expectAnswersKept();
  expect(router.replace).toHaveBeenCalledWith(SIGN_IN);
  expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.sessionExpired, tone: 'info' });
  expect(mockSignOut).toHaveBeenCalledTimes(1);
});

test('a session Clerk ends on its own keeps the answers, and they are still there after signing in again', async () => {
  const tree = renderScreen(app());
  await settle();

  mockAuth.isSignedIn = false;
  act(() => tree.update(app()));
  await settle();

  expectAnswersKept();
  expect(router.replace).toHaveBeenCalledWith(SIGN_IN);
  expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.sessionExpired, tone: 'info' });

  mockAuth.isSignedIn = true;
  act(() => tree.update(app()));
  await settle();
  expectAnswersKept();
});

test('a session that refreshes is unchanged', async () => {
  renderScreen(app());
  await settle();
  await send({ type: 'SIGNED_IN', hasCompletedOnboarding: false });
  jest.mocked(router.replace).mockClear();

  await send({ type: 'UNAUTHORIZED' });

  expectAnswersKept();
  expect(router.replace).not.toHaveBeenCalled();
  expect(showToast).not.toHaveBeenCalled();
  expect(mockSignOut).not.toHaveBeenCalled();
});

test('a deliberate sign-out still clears the answers, with no expired message', async () => {
  const tree = renderScreen(app());
  await settle();

  await send({ type: 'SIGN_OUT' });
  act(() => tree.update(app()));
  await settle();

  expect(useOnboardingStore.getState().goal).toBeNull();
  expect(useOnboardingStore.getState().last_step).toBeNull();
  expect(showToast).not.toHaveBeenCalled();
});
