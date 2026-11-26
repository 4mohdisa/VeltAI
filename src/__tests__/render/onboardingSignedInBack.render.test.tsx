// Row 2b dead end 5: once signed in, the user must not land back on the
// provider buttons, and a provider pressed while signed in must not start a
// second sign-in. EXECUTES the real Measurements and Signup screens. No real
// network, no real Clerk calls.
import MeasurementsScreen from '@/app/onboarding/measurements';
import SignupScreen from '@/app/onboarding/signup';
import { router } from 'expo-router';
import { useToastStore } from '@/components/display/toastStore';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  usePathname: () => '/onboarding/measurements',
  Href: {},
}));

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const SESSION_EXISTS = { errors: [{ code: 'session_exists', message: "You're already signed in." }] };
const mockStartSSOFlow = jest.fn();
const mockSignUpCreate = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: (...args: unknown[]) => mockStartSSOFlow(...args) }),
  useSignUp: () => ({
    signUp: { create: (...args: unknown[]) => mockSignUpCreate(...args) },
    setActive: jest.fn(),
    isLoaded: true,
  }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

const mockOnboardingGet = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { onboarding: { get: (...args: unknown[]) => mockOnboardingGet(...args) } },
}));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  mockStartSSOFlow.mockReset();
  mockSignUpCreate.mockReset();
  mockOnboardingGet.mockReset().mockResolvedValue({ completed: false });
  jest.mocked(router.dismissTo).mockClear();
  useToastStore.getState().dismiss();
  // Steps 1 to 6 come before signup, so their answers are on the device.
  useOnboardingStore.getState().setGoal('lose');
  useOnboardingStore.getState().setActivity('moderate');
});

test('back from measurements skips the signup buttons and returns to preview', () => {
  const tree = renderScreen(<MeasurementsScreen />);
  const back = findAll(tree, (p) => p.accessibilityLabel === en.common.goBack && typeof p.onPress === 'function')[0];

  act(() => (back.props.onPress as () => void)());

  expect(router.dismissTo).toHaveBeenCalledWith('/onboarding/preview');
  expect(router.back).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalledWith('/onboarding/signup');
});

test.each([
  ['Apple', en.signup.continueApple],
  ['Google', en.signup.continueGoogle],
])('%s pressed while signed in continues the flow instead of a second sign-in', async (_name, label) => {
  mockStartSSOFlow.mockRejectedValue(SESSION_EXISTS);
  const tree = renderScreen(<SignupScreen />);

  act(() => (buttonWithTitle(tree, label)!.props.onPress as () => void)());
  await settle();

  expect(mockStartSSOFlow).toHaveBeenCalledTimes(1);
  expect(mockOnboardingGet).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/onboarding/measurements');
  expect(useToastStore.getState().current?.tone).not.toBe('error');
});

test('email sign-up while signed in continues the flow instead of asking for a code', async () => {
  mockSignUpCreate.mockRejectedValue(SESSION_EXISTS);
  const tree = renderScreen(<SignupScreen />);
  act(() => (buttonWithTitle(tree, en.signup.continueEmail)!.props.onPress as () => void)());
  const emailField = findAll(tree, (p) => p.label === en.signup.emailLabel)[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('signed-in@example.com'));

  act(() => (buttonWithTitle(tree, en.signup.sendCode)!.props.onPress as () => void)());
  await settle();

  expect(mockOnboardingGet).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/onboarding/measurements');
  expect(findAll(tree, (p) => p.label === en.signup.codeLabel)).toHaveLength(0);
  expect(useToastStore.getState().current?.tone).not.toBe('error');
});

test('any other Clerk error still shows the error toast and does not continue', async () => {
  mockStartSSOFlow.mockRejectedValue({ errors: [{ code: 'form_identifier_exists', message: 'Email taken' }] });
  const tree = renderScreen(<SignupScreen />);

  act(() => (buttonWithTitle(tree, en.signup.continueApple)!.props.onPress as () => void)());
  await settle();

  expect(mockOnboardingGet).not.toHaveBeenCalled();
  expect(useToastStore.getState().current).toMatchObject({ message: en.signup.errorEmailExists, tone: 'error' });
});
