// Sign up → onboarding status check (PHASE4_ROWS.md row 2b, session expiry).
// EXECUTES the real screen through the email-code path to continueAfterAuth.
// A 401 from the status check means the session is not valid: sign in again,
// never "Couldn't reach the server". A network error keeps that message, and a
// success continues. The API client and Clerk are mocked; no network.
import SignupScreen from '@/app/onboarding/signup';
import { router } from 'expo-router';
import { showToast } from '@/components/display/toastStore';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({
    signUp: {
      create: jest.fn().mockResolvedValue(undefined),
      prepareEmailAddressVerification: jest.fn().mockResolvedValue(undefined),
      attemptEmailAddressVerification: jest
        .fn()
        .mockResolvedValue({ status: 'complete', createdSessionId: 'sess_test' }),
    },
    setActive: jest.fn().mockResolvedValue(undefined),
    isLoaded: true,
  }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

const mockGet = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { onboarding: { get: (...args: unknown[]) => mockGet(...args) } },
}));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function verifyEmailCode(): Promise<void> {
  const tree = renderScreen(<SignupScreen />);
  act(() => (buttonWithTitle(tree, en.signup.continueEmail)!.props.onPress as () => void)());
  const emailField = findAll(tree, (p) => p.label === en.signup.emailLabel)[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('auth401@example.com'));
  act(() => (buttonWithTitle(tree, en.signup.sendCode)!.props.onPress as () => void)());
  await settle();
  const codeField = findAll(tree, (p) => p.label === en.signup.codeLabel)[0];
  act(() => (codeField.props.onChangeText as (t: string) => void)('123456'));
  act(() => (buttonWithTitle(tree, en.signup.verify)!.props.onPress as () => void)());
  await settle();
}

beforeEach(() => {
  mockGet.mockReset();
  jest.mocked(showToast).mockClear();
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setGoal('lose');
});

test('a 401 sends the user to sign in with the session expired message', async () => {
  mockGet.mockRejectedValueOnce(Object.assign(new Error('invalid token'), { status: 401 }));
  await verifyEmailCode();

  expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.sessionExpired, tone: 'error' });
  expect(showToast).not.toHaveBeenCalledWith(
    expect.objectContaining({ message: en.signup.toastServerUnreachable }),
  );
  expect(router.push).toHaveBeenCalledWith('/onboarding/signup?mode=signin');
  expect(useOnboardingStore.getState().goal).toBe('lose');
});

test('a network error still shows the server message and continues the flow', async () => {
  mockGet.mockRejectedValueOnce(new TypeError('Network request failed'));
  await verifyEmailCode();

  expect(showToast).toHaveBeenCalledWith({ message: en.signup.toastServerUnreachable, tone: 'info' });
  expect(router.push).toHaveBeenCalledWith('/onboarding/measurements');
  expect(router.push).not.toHaveBeenCalledWith('/onboarding/signup?mode=signin');
});

test('a successful status check continues without an error message', async () => {
  mockGet.mockResolvedValueOnce({ completed: false });
  await verifyEmailCode();

  expect(router.push).toHaveBeenCalledWith('/onboarding/measurements');
  expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ tone: 'error' }));
});
