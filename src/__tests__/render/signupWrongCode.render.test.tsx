// Sign up / sign in screen (PHASE4_ROWS.md row 2b): a wrong email code shows
// under the code field, like email errors under the email field, not as a
// toast. Editing the code clears it. No real network, no real Clerk calls.
import SignupScreen from '@/app/onboarding/signup';
import { useToastStore } from '@/components/display/toastStore';
import en from '@/lib/i18n/locales/en.json';
import { act, buttonWithTitle, findAll, renderScreen, screenTitle } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const mockAttemptEmail = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({
    signUp: {
      create: jest.fn().mockResolvedValue(undefined),
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

const codeField = (tree: ReturnType<typeof renderScreen>) =>
  findAll(tree, (p) => p.label === en.signup.codeLabel)[0];

beforeEach(() => {
  mockAttemptEmail.mockReset().mockRejectedValue({ errors: [{ code: 'form_code_incorrect', message: 'Incorrect code' }] });
});

test('a wrong code shows under the code field, not as a toast, and editing the code clears it', async () => {
  const tree = renderScreen(<SignupScreen />);
  expect(screenTitle(tree)).toBe(en.signup.titleSignUp);

  act(() => (buttonWithTitle(tree, en.signup.continueEmail)!.props.onPress as () => void)());
  const emailField = findAll(tree, (p) => p.label === en.signup.emailLabel)[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('wrong-code@example.com'));
  act(() => (buttonWithTitle(tree, en.signup.sendCode)!.props.onPress as () => void)());
  await settle();
  act(() => useToastStore.getState().dismiss());

  act(() => (codeField(tree).props.onChangeText as (t: string) => void)('000000'));
  act(() => (buttonWithTitle(tree, en.signup.verify)!.props.onPress as () => void)());
  await settle();

  expect(codeField(tree).props.error).toBe(en.signup.errorCodeIncorrect);
  expect(useToastStore.getState().current).toBeNull();

  act(() => (codeField(tree).props.onChangeText as (t: string) => void)('00000'));

  expect(codeField(tree).props.error).toBeUndefined();
});
