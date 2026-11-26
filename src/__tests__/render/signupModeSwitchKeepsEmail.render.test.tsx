// Sign up / sign in screen (PHASE4_ROWS.md row 2b): "That email already has an
// account — try signing in instead." used to be a dead end, because the mode
// toggle sent the user back to the provider buttons. The toggle now keeps the
// email stage and the typed email, so Send code works in one tap.
import SignupScreen from '@/app/onboarding/signup';
import { act, buttonWithTitle, findAll, renderScreen, screenTitle } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const mockSignUpCreate = jest.fn();
const mockSignInCreate = jest.fn();
const mockPrepareFirstFactor = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({
    signUp: {
      create: (...args: unknown[]) => mockSignUpCreate(...args),
      prepareEmailAddressVerification: jest.fn(),
    },
    setActive: jest.fn(),
    isLoaded: true,
  }),
  useSignIn: () => ({
    signIn: {
      create: (...args: unknown[]) => mockSignInCreate(...args),
      prepareFirstFactor: (...args: unknown[]) => mockPrepareFirstFactor(...args),
    },
    setActive: jest.fn(),
    isLoaded: true,
  }),
}));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

function pressText(tree: ReturnType<typeof renderScreen>, text: string) {
  act(() => {
    const target = findAll(tree, (p) => {
      const child = p.children as { props?: { children?: unknown } } | undefined;
      return typeof p.onPress === 'function' && child?.props?.children === text;
    })[0];
    (target.props.onPress as () => void)();
  });
}

const emailField = (tree: ReturnType<typeof renderScreen>) => findAll(tree, (p) => p.label === 'Email')[0];

beforeEach(() => {
  mockSignUpCreate.mockReset().mockRejectedValue({ errors: [{ code: 'form_identifier_exists', message: 'Email taken' }] });
  mockSignInCreate.mockReset().mockResolvedValue({
    supportedFirstFactors: [{ strategy: 'email_code', emailAddressId: 'idn_test' }],
  });
  mockPrepareFirstFactor.mockReset().mockResolvedValue(undefined);
});

test('switching to sign in after "email already has an account" keeps the email stage and the typed email', async () => {
  const tree = renderScreen(<SignupScreen />);
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());
  act(() => (emailField(tree).props.onChangeText as (t: string) => void)('exists@example.com'));
  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
  await settle();

  pressText(tree, 'Already have an account? Sign in');

  expect(screenTitle(tree)).toBe('Sign in');
  expect(emailField(tree).props.value).toBe('exists@example.com');
  expect(emailField(tree).props.error).toBeUndefined();

  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
  await settle();

  expect(mockSignInCreate).toHaveBeenCalledWith({ identifier: 'exists@example.com' });
  expect(findAll(tree, (p) => p.label === 'Code')[0]).toBeDefined();
});

test('switching mode from the code stage returns to the email stage with the code cleared', async () => {
  const tree = renderScreen(<SignupScreen />);
  pressText(tree, 'Already have an account? Sign in');
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());
  act(() => (emailField(tree).props.onChangeText as (t: string) => void)('me@example.com'));
  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
  await settle();
  act(() => (findAll(tree, (p) => p.label === 'Code')[0].props.onChangeText as (t: string) => void)('123456'));

  pressText(tree, 'New to Lume? Create an account');

  expect(screenTitle(tree)).toBe('Create your account');
  expect(emailField(tree).props.value).toBe('me@example.com');
  expect(findAll(tree, (p) => p.label === 'Code')).toHaveLength(0);

  pressText(tree, 'Already have an account? Sign in');
  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
  await settle();

  expect(findAll(tree, (p) => p.label === 'Code')[0].props.value).toBe('');
});

test('switching mode on the provider buttons stays on the provider buttons', () => {
  const tree = renderScreen(<SignupScreen />);
  pressText(tree, 'Already have an account? Sign in');

  expect(buttonWithTitle(tree, 'Continue with email →')).toBeDefined();
  expect(findAll(tree, (p) => p.label === 'Email')).toHaveLength(0);
});
