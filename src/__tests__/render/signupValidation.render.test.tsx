// Sign up / sign in screen (PHASE2_ROWS.md row 1) — the client-side
// validation messages in sendCode/verifyCode (src/app/onboarding/signup.tsx
// :184-186, :213-215): an invalid email or an empty code is rejected before
// any Clerk call, showing 'Enter a valid email address.' / 'Enter the code
// from your email.'. This EXECUTES the real screen; it is not a source-text
// grep. No real network, no real Clerk calls.
import SignupScreen from '@/app/onboarding/signup';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const mockSignUpCreate = jest.fn();
const mockAttemptEmail = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({
    signUp: {
      create: (...args: unknown[]) => mockSignUpCreate(...args),
      prepareEmailAddressVerification: jest.fn().mockResolvedValue(undefined),
      attemptEmailAddressVerification: (...args: unknown[]) => mockAttemptEmail(...args),
    },
    setActive: jest.fn(),
    isLoaded: true,
  }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  mockSignUpCreate.mockClear().mockResolvedValue(undefined);
  mockAttemptEmail.mockClear();
});

test('an invalid email shows the email validation message and never calls Clerk', () => {
  const tree = renderScreen(<SignupScreen />);
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());

  const emailField = findAll(tree, (p) => p.label === 'Email')[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('not-an-email'));
  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());

  expect(allText(tree)).toContain('Enter a valid email address.');
  expect(mockSignUpCreate).not.toHaveBeenCalled();
});

test('an empty code shows the code validation message and never calls Clerk', async () => {
  const tree = renderScreen(<SignupScreen />);
  act(() => (buttonWithTitle(tree, 'Continue with email →')!.props.onPress as () => void)());

  const emailField = findAll(tree, (p) => p.label === 'Email')[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('valid@example.com'));
  act(() => (buttonWithTitle(tree, 'Send code')!.props.onPress as () => void)());
  await settle();

  const codeField = findAll(tree, (p) => p.label === 'Code')[0];
  act(() => (codeField.props.onChangeText as (t: string) => void)(''));
  act(() => (buttonWithTitle(tree, 'Verify')!.props.onPress as () => void)());

  expect(allText(tree)).toContain('Enter the code from your email.');
  expect(mockAttemptEmail).not.toHaveBeenCalled();
});
