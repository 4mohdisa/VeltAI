// Sign up / sign in screen (PHASE2_ROWS.md row 1) — the sign-IN mode branch
// (toggled via "Already have an account? Sign in") that signupOtp.render
// .test.tsx never reaches — that file's useSignIn mock leaves `signIn`
// undefined, since it only drives the sign-up branch. This EXECUTES the real
// screen; it is not a source-text grep. No real network, no real Clerk calls.
import SignupScreen from '@/app/onboarding/signup';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const mockSignInCreate = jest.fn().mockResolvedValue({
  supportedFirstFactors: [{ strategy: 'email_code', emailAddressId: 'idn_test' }],
});
const mockPrepareFirstFactor = jest.fn().mockResolvedValue(undefined);
const mockAttemptFirstFactor = jest.fn().mockResolvedValue({ status: 'complete', createdSessionId: 'sess_test' });
const mockSetActiveIn = jest.fn().mockResolvedValue(undefined);

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({ signUp: undefined, setActive: jest.fn(), isLoaded: true }),
  useSignIn: () => ({
    signIn: {
      create: (...args: unknown[]) => mockSignInCreate(...args),
      prepareFirstFactor: (...args: unknown[]) => mockPrepareFirstFactor(...args),
      attemptFirstFactor: (...args: unknown[]) => mockAttemptFirstFactor(...args),
    },
    setActive: (...args: unknown[]) => mockSetActiveIn(...args),
    isLoaded: true,
  }),
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

function pressModeToggle(tree: ReturnType<typeof renderScreen>) {
  act(() => {
    const toggle = findAll(tree, (p) => {
      const child = p.children as { props?: { children?: unknown } } | undefined;
      return child?.props?.children === 'Already have an account? Sign in';
    })[0];
    (toggle.props.onPress as () => void)();
  });
}

beforeEach(() => {
  mockSignInCreate.mockClear();
  mockPrepareFirstFactor.mockClear();
  mockAttemptFirstFactor.mockClear();
  mockSetActiveIn.mockClear();
  mockGet.mockClear();
});

test('pressing "Already have an account? Sign in" switches to sign-in mode', () => {
  const tree = renderScreen(<SignupScreen />);
  pressModeToggle(tree);

  expect(allText(tree)).toContain('New to Lume? Create an account');
});

test('sending a code in sign-in mode calls signIn.create then prepareFirstFactor', async () => {
  const tree = renderScreen(<SignupScreen />);
  pressModeToggle(tree);
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());

  const emailField = findAll(tree, (p) => p.label === 'Email')[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('signin-test@example.com'));

  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
  await settle();

  expect(mockSignInCreate).toHaveBeenCalledWith({ identifier: 'signin-test@example.com' });
  expect(mockPrepareFirstFactor).toHaveBeenCalledWith({ strategy: 'email_code', emailAddressId: 'idn_test' });
  expect(allText(tree)).toContain('Enter the code we sent to signin-test@example.com');
  expect(findAll(tree, (p) => p.label === 'Code')[0]).toBeDefined();
});

test('verifying the code in sign-in mode calls attemptFirstFactor then setActiveIn, and routes on success', async () => {
  const tree = renderScreen(<SignupScreen />);
  pressModeToggle(tree);
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());

  const emailField = findAll(tree, (p) => p.label === 'Email')[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('signin-test@example.com'));
  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
  await settle();

  const codeField = findAll(tree, (p) => p.label === 'Code')[0];
  act(() => (codeField.props.onChangeText as (t: string) => void)('123456'));
  act(() => (buttonWithTitle(tree, 'Verify')!.props.onPress as () => void)());
  await settle();

  expect(mockAttemptFirstFactor).toHaveBeenCalledWith({ strategy: 'email_code', code: '123456' });
  expect(mockSetActiveIn).toHaveBeenCalledWith({ session: 'sess_test' });
  expect(mockGet).toHaveBeenCalledTimes(1);

  const { router } = require('expo-router') as { router: { replace: jest.Mock } };
  expect(router.replace).toHaveBeenCalledWith('/(tabs)');
});
