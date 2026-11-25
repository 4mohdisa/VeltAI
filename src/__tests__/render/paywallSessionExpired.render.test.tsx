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
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
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

const mockBillingEnabled = jest.fn(() => false);
const mockPresentPaywall = jest.fn();
jest.mock('@/lib/billing/purchases', () => ({
  isBillingEnabled: () => mockBillingEnabled(),
  presentPaywall: () => mockPresentPaywall(),
  restorePurchases: jest.fn(),
  hasProEntitlement: () => false,
  TRIAL_DAYS: 7,
}));

const mockPost = jest.fn();
const mockSubscriptionGet = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    onboarding: { post: (...args: unknown[]) => mockPost(...args) },
    subscription: { get: () => mockSubscriptionGet() },
  },
  sleep: () => Promise.resolve(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const mockSignOut = jest.fn().mockResolvedValue(undefined);

const CONNECTION_MESSAGE = en.onboarding.paywall.submitFailed;

async function pressContinue(title = 'Continue'): Promise<void> {
  const tree = renderScreen(<PaywallScreen />);
  await act(async () => {
    (buttonWithTitle(tree, title)!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

beforeEach(() => {
  jest.mocked(showToast).mockClear();
  mockPost.mockReset();
  mockSubscriptionGet.mockReset();
  mockBillingEnabled.mockReturnValue(false);
  mockSignOut.mockClear();
  registerSignOutExecutor(mockSignOut);
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setMeasurements({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80 });
  useOnboardingStore.getState().setActivity('moderate');
  useOnboardingStore.getState().setGoal('lose');
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
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

test('a 401 on the subscription check ends the session and keeps the answers', async () => {
  mockBillingEnabled.mockReturnValue(true);
  mockPresentPaywall.mockResolvedValueOnce('purchased');
  mockSubscriptionGet.mockRejectedValueOnce(new ApiError(401, 'invalid token'));
  await pressContinue(en.onboarding.paywall.seePlans);

  expect(mockSubscriptionGet).toHaveBeenCalledTimes(1);
  expect(mockPost).not.toHaveBeenCalled();
  expect(mockSignOut).toHaveBeenCalledTimes(1);
  expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.sessionExpired, tone: 'info' });
  expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ message: en.onboarding.paywall.notConfirmed }));
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

test.each([400, 422])('a %i shows the translated failure copy, never the server text', async (status) => {
  const serverText = 'height_cm must be a number';
  mockPost.mockRejectedValueOnce(new ApiError(status, serverText));
  await pressContinue();

  expect(showToast).toHaveBeenCalledWith({ message: CONNECTION_MESSAGE, tone: 'error' });
  expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ message: serverText }));
  expect(mockSignOut).not.toHaveBeenCalled();
});

test('a 5xx keeps the failure copy and stays put', async () => {
  mockPost.mockRejectedValueOnce(new ApiError(503, 'Service Unavailable'));
  await pressContinue();

  expect(showToast).toHaveBeenCalledWith({ message: CONNECTION_MESSAGE, tone: 'error' });
  expect(router.push).not.toHaveBeenCalled();
  expect(mockSignOut).not.toHaveBeenCalled();
});

test('fr: a 4xx shows the French failure copy', async () => {
  await act(async () => {
    await i18n.changeLanguage('fr');
  });
  mockPost.mockRejectedValueOnce(new ApiError(400, 'height_cm must be a number'));
  const tree = renderScreen(<PaywallScreen />);
  await act(async () => {
    (buttonWithTitle(tree, fr.onboarding.measurements.continue)!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(showToast).toHaveBeenCalledWith({ message: fr.onboarding.paywall.submitFailed, tone: 'error' });
});

// The same toast reaches users who already finished onboarding (launch gate),
// so the copy must not mention finishing setup.
test('the expired-session copy is true for any signed-in user', () => {
  expect(en.onboarding.sessionExpired).toBe('Your session ended. Sign in again to continue.');
});

test.each([
  ['es', es],
  ['fr', fr],
])('%s: the expired-session toast is translated', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  mockPost.mockRejectedValueOnce(new ApiError(401, 'invalid token'));
  const tree = renderScreen(<PaywallScreen />);
  await act(async () => {
    (buttonWithTitle(tree, locale.onboarding.measurements.continue)!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(locale.onboarding.sessionExpired).not.toBe(en.onboarding.sessionExpired);
  expect(showToast).toHaveBeenCalledWith({ message: locale.onboarding.sessionExpired, tone: 'info' });
  expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ message: en.onboarding.sessionExpired }));
});
