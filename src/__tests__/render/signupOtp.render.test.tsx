// Sign up / sign in screen (PHASE2_ROWS.md row 1) — the OTP sub-stages
// (email entry, then code entry) that signup.render.test.tsx and
// signupReadBack.render.test.tsx don't reach. This EXECUTES the real screen;
// it is not a source-text grep. No real network, no real Clerk calls.
import SignupScreen from '@/app/onboarding/signup';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const mockCreate = jest.fn().mockResolvedValue(undefined);
const mockPrepareEmail = jest.fn().mockResolvedValue(undefined);
const mockAttemptEmail = jest.fn().mockResolvedValue({ status: 'complete', createdSessionId: 'sess_test' });
const mockSetActiveUp = jest.fn().mockResolvedValue(undefined);

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({
    signUp: {
      create: (...args: unknown[]) => mockCreate(...args),
      prepareEmailAddressVerification: (...args: unknown[]) => mockPrepareEmail(...args),
      attemptEmailAddressVerification: (...args: unknown[]) => mockAttemptEmail(...args),
    },
    setActive: (...args: unknown[]) => mockSetActiveUp(...args),
    isLoaded: true,
  }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

const mockGet = jest.fn().mockResolvedValue({ completed: true });
jest.mock('@/lib/api', () => ({
  api: { onboarding: { get: (...args: unknown[]) => mockGet(...args) } },
}));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  mockCreate.mockClear();
  mockPrepareEmail.mockClear();
  mockAttemptEmail.mockClear();
  mockSetActiveUp.mockClear();
  mockGet.mockClear();
});

test('pressing "Continue with email" reaches the email entry sub-stage', () => {
  const tree = renderScreen(<SignupScreen />);
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());

  expect(findAll(tree, (p) => p.label === 'Email')[0]).toBeDefined();
  expect(buttonWithTitle(tree, 'Send code')).toBeDefined();
});

test('sending a code reaches the code entry sub-stage with its prompt', async () => {
  const tree = renderScreen(<SignupScreen />);
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());

  const emailField = findAll(tree, (p) => p.label === 'Email')[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('otp-test@example.com'));

  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
  await settle();

  expect(allText(tree)).toContain('Enter the code we sent to otp-test@example.com');
  expect(findAll(tree, (p) => p.label === 'Code')[0]).toBeDefined();
  expect(buttonWithTitle(tree, 'Verify')).toBeDefined();
});

test('verifying the code signs in and routes on success', async () => {
  const tree = renderScreen(<SignupScreen />);
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());

  const emailField = findAll(tree, (p) => p.label === 'Email')[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('otp-test@example.com'));
  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
  await settle();

  const codeField = findAll(tree, (p) => p.label === 'Code')[0];
  act(() => (codeField.props.onChangeText as (t: string) => void)('123456'));
  act(() => (buttonWithTitle(tree, 'Verify')!.props.onPress as () => void)());
  await settle();

  expect(mockAttemptEmail).toHaveBeenCalledWith({ code: '123456' });
  expect(mockSetActiveUp).toHaveBeenCalledWith({ session: 'sess_test' });
  expect(mockGet).toHaveBeenCalledTimes(1);

  const { router } = require('expo-router') as { router: { replace: jest.Mock } };
  expect(router.replace).toHaveBeenCalledWith('/(tabs)');
});
