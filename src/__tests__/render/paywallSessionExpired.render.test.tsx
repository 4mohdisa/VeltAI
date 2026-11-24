// Paywall submit failures (PHASE4_ROWS.md row 2b, session-expiry dead end).
// EXECUTES the real screen's CTA. An expired session (401) dispatches
// SESSION_ENDED: the real auth runtime ends the rejected Clerk session, keeps
// the onboarding answers and opens sign in, never "check your connection"; a real network failure must still show
// the connection message. The store, purchase module and API are all mocked.
import PaywallScreen from '@/app/onboarding/paywall';
import { router } from 'expo-router';
import { showToast } from '@/components/display';
import { ApiError } from '@/lib/api';
import { registerSignOutExecutor } from '@/lib/auth/signOutSeam';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, buttonWithTitle, renderScreen } from './helpers';

// Mocked at its source, so the screen (through the display barrel) and the
// auth runtime (directly) share one spy.
jest.mock('@/components/display/toastStore', () => ({
  ...jest.requireActual('@/components/display/toastStore'),
  showToast: jest.fn(),
}));

jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));

jest.mock('@/lib/billing/purchases', () => ({
  isBillingEnabled: () => false,
  presentPaywall: jest.fn(),
  restorePurchases: jest.fn(),
  hasProEntitlement: () => false,
  TRIAL_DAYS: 7,
}));

const mockPost = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { onboarding: { post: (...args: unknown[]) => mockPost(...args) } },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const mockSignOut = jest.fn().mockResolvedValue(undefined);

const CONNECTION_MESSAGE = "Couldn't finish setup — check your connection and try again.";

async function pressContinue(): Promise<void> {
  const tree = renderScreen(<PaywallScreen />);
  await act(async () => {
    (buttonWithTitle(tree, 'Continue')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

beforeEach(() => {
  jest.mocked(showToast).mockClear();
  mockPost.mockReset();
  mockSignOut.mockClear();
  registerSignOutExecutor(mockSignOut);
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setMeasurements({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80 });
  useOnboardingStore.getState().setActivity('moderate');
  useOnboardingStore.getState().setGoal('lose');
});

afterAll(() => registerSignOutExecutor(null));

test('an expired session ends the Clerk session, keeps the answers and opens sign-in mode', async () => {
  mockPost.mockRejectedValueOnce(new ApiError(401, 'invalid token'));
  await pressContinue();

  expect(mockSignOut).toHaveBeenCalledTimes(1);
  expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.sessionExpired, tone: 'info' });
  expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ message: CONNECTION_MESSAGE }));
  expect(router.replace).toHaveBeenCalledWith('/onboarding/signup?mode=signin');
  expect(useOnboardingStore.getState().goal).toBe('lose');
});

test('a network failure still shows the connection message and stays put', async () => {
  mockPost.mockRejectedValueOnce(new TypeError('Network request failed'));
  await pressContinue();

  expect(showToast).toHaveBeenCalledWith({ message: CONNECTION_MESSAGE, tone: 'error' });
  expect(router.push).not.toHaveBeenCalled();
  expect(mockSignOut).not.toHaveBeenCalled();
});
