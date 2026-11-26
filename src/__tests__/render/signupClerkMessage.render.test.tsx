// Sign up / sign in screen (PHASE2_ROWS.md row 1) — the local clerkMessage
// error-code mapping (src/app/onboarding/signup.tsx:173), tested indirectly
// through the real screen since clerkMessage is a closure inside ClerkSignup,
// not exported. This EXECUTES the real screen's sendCode/verifyCode catch
// blocks with Clerk rejections shaped like the real SDK's error objects; it
// is not a source-text grep. No real network, no real Clerk calls.
import SignupScreen from '@/app/onboarding/signup';
import { useToastStore } from '@/components/display/toastStore';
import { act, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const mockSignUpCreate = jest.fn();
const mockPrepareEmail = jest.fn();
const mockAttemptEmail = jest.fn();
const mockSetActiveUp = jest.fn();
const mockSignInCreate = jest.fn();
const mockPrepareFirstFactor = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({
    signUp: {
      create: (...args: unknown[]) => mockSignUpCreate(...args),
      prepareEmailAddressVerification: (...args: unknown[]) => mockPrepareEmail(...args),
      attemptEmailAddressVerification: (...args: unknown[]) => mockAttemptEmail(...args),
    },
    setActive: (...args: unknown[]) => mockSetActiveUp(...args),
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

function pressModeToggle(tree: ReturnType<typeof renderScreen>) {
  act(() => {
    const toggle = findAll(tree, (p) => {
      const child = p.children as { props?: { children?: unknown } } | undefined;
      return child?.props?.children === 'Already have an account? Sign in';
    })[0];
    (toggle.props.onPress as () => void)();
  });
}

function enterEmailAndSendCode(tree: ReturnType<typeof renderScreen>, email: string) {
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());
  const emailField = findAll(tree, (p) => p.label === 'Email')[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)(email));
  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
}

const emailFieldError = (tree: ReturnType<typeof renderScreen>) =>
  findAll(tree, (p) => p.label === 'Email')[0].props.error;

beforeEach(() => {
  mockSignUpCreate.mockReset().mockResolvedValue(undefined);
  mockPrepareEmail.mockReset().mockResolvedValue(undefined);
  mockAttemptEmail.mockReset();
  mockSetActiveUp.mockReset();
  mockSignInCreate.mockReset();
  mockPrepareFirstFactor.mockReset().mockResolvedValue(undefined);
  useToastStore.getState().dismiss();
});

test('form_identifier_exists shows "That email already has an account — try signing in instead."', async () => {
  mockSignUpCreate.mockRejectedValueOnce({ errors: [{ code: 'form_identifier_exists', message: 'Email taken' }] });

  const tree = renderScreen(<SignupScreen />);
  enterEmailAndSendCode(tree, 'exists@example.com');
  await settle();

  expect(emailFieldError(tree)).toBe('That email already has an account — try signing in instead.');
});

test('form_identifier_not_found shows "No account with that email — try signing up instead."', async () => {
  mockSignInCreate.mockRejectedValueOnce({ errors: [{ code: 'form_identifier_not_found', message: 'No such user' }] });

  const tree = renderScreen(<SignupScreen />);
  pressModeToggle(tree);
  enterEmailAndSendCode(tree, 'missing@example.com');
  await settle();

  expect(emailFieldError(tree)).toBe('No account with that email — try signing up instead.');
});

test('form_code_incorrect shows "That code isn\'t right — check it and try again."', async () => {
  mockAttemptEmail.mockRejectedValueOnce({ errors: [{ code: 'form_code_incorrect', message: 'Incorrect code' }] });

  const tree = renderScreen(<SignupScreen />);
  enterEmailAndSendCode(tree, 'code-test@example.com');
  await settle();

  const codeField = findAll(tree, (p) => p.label === 'Code')[0];
  act(() => (codeField.props.onChangeText as (t: string) => void)('000000'));
  act(() => (buttonWithTitle(tree, 'Verify')!.props.onPress as () => void)());
  await settle();

  expect(useToastStore.getState().current).toMatchObject({
    message: "That code isn't right — check it and try again.",
    tone: 'error',
  });
});

test("an unmapped error code with Clerk's own message shows the generic message, not Clerk's text", async () => {
  mockSignUpCreate.mockRejectedValueOnce({
    errors: [{ code: 'too_many_requests', message: 'You have exceeded the rate limit.' }],
  });

  const tree = renderScreen(<SignupScreen />);
  enterEmailAndSendCode(tree, 'limited@example.com');
  await settle();

  expect(emailFieldError(tree)).toBe('Something went wrong. Check your connection and try again.');
});

test('an unmapped error code with no message falls back to the generic message', async () => {
  mockSignUpCreate.mockRejectedValueOnce({ errors: [{ code: 'some_unmapped_code' }] });

  const tree = renderScreen(<SignupScreen />);
  enterEmailAndSendCode(tree, 'unknown@example.com');
  await settle();

  expect(emailFieldError(tree)).toBe('Something went wrong. Check your connection and try again.');
});

test('a rejected email shows its message under the email field, not as a toast, and correcting the email clears it', async () => {
  mockSignUpCreate.mockRejectedValueOnce({ errors: [{ code: 'form_identifier_exists', message: 'Email taken' }] });

  const tree = renderScreen(<SignupScreen />);
  enterEmailAndSendCode(tree, 'exists@example.com');
  await settle();

  expect(emailFieldError(tree)).toBe('That email already has an account — try signing in instead.');
  expect(useToastStore.getState().current).toBeNull();

  const emailField = findAll(tree, (p) => p.label === 'Email')[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('new@example.com'));

  expect(emailFieldError(tree)).toBeUndefined();
});
