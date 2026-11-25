// Sign up / sign in screen (PHASE4_ROWS.md row 2b, step 1b). EXECUTES the real
// screen: the title follows the mode in en, es and fr, and the code stage has a
// Resend code button that re-runs Clerk's prepare call once, shows its loading
// state, and names a failure inline. No real network, no real Clerk calls.
import SignupScreen from '@/app/onboarding/signup';
import { useLocalSearchParams } from 'expo-router';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: () => '/onboarding/signup',
  Href: {},
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const mockCreate = jest.fn().mockResolvedValue(undefined);
const mockPrepareEmail = jest.fn().mockResolvedValue(undefined);

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({
    signUp: {
      create: (...args: unknown[]) => mockCreate(...args),
      prepareEmailAddressVerification: (...args: unknown[]) => mockPrepareEmail(...args),
      attemptEmailAddressVerification: jest.fn(),
    },
    setActive: jest.fn(),
    isLoaded: true,
  }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

jest.mock('@/lib/api', () => ({
  api: { onboarding: { get: jest.fn().mockResolvedValue({ completed: false }) } },
}));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function reachCodeStage() {
  const tree = renderScreen(<SignupScreen />);
  act(() => (buttonWithTitle(tree, en.signup.continueEmail)!.props.onPress as () => void)());
  const emailField = findAll(tree, (p) => p.label === en.signup.emailLabel)[0];
  act(() => (emailField.props.onChangeText as (t: string) => void)('resend-test@example.com'));
  act(() => (buttonWithTitle(tree, en.signup.sendCode)!.props.onPress as () => void)());
  await settle();
  mockPrepareEmail.mockClear();
  return tree;
}

const pressResend = (tree: ReturnType<typeof renderScreen>) =>
  act(() => (buttonWithTitle(tree, en.signup.resendCode)!.props.onPress as () => void)());

beforeEach(() => {
  mockCreate.mockClear();
  mockPrepareEmail.mockReset().mockResolvedValue(undefined);
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the title follows the mode', (lng, locale) => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage(lng);
    });
  });

  test('sign-up mode shows the create-account title', () => {
    const text = allText(renderScreen(<SignupScreen />));
    expect(text).toContain(locale.signup.titleSignUp);
    expect(text).toContain(locale.signup.toggleToSignIn);
  });

  test('sign-in mode shows the sign-in title', () => {
    jest.mocked(useLocalSearchParams).mockReturnValueOnce({ mode: 'signin' });
    const text = allText(renderScreen(<SignupScreen />));
    expect(text).toContain(locale.signup.titleSignIn);
    expect(text).not.toContain(locale.signup.titleSignUp);
  });
});

test('the code stage shows a Resend code button', async () => {
  const tree = await reachCodeStage();
  expect(buttonWithTitle(tree, en.signup.resendCode)).toBeDefined();
});

test('tapping Resend code calls the prepare call once', async () => {
  const tree = await reachCodeStage();
  pressResend(tree);
  await settle();
  expect(mockPrepareEmail).toHaveBeenCalledTimes(1);
  expect(mockPrepareEmail).toHaveBeenCalledWith({ strategy: 'email_code' });
});

test('Resend code shows its loading state while the call is in flight', async () => {
  const tree = await reachCodeStage();
  let finish!: () => void;
  mockPrepareEmail.mockReturnValueOnce(new Promise<void>((r) => (finish = r)));

  pressResend(tree);
  expect(buttonWithTitle(tree, en.signup.resendCode)!.props.loading).toBe(true);

  await act(async () => finish());
  await settle();
  expect(buttonWithTitle(tree, en.signup.resendCode)!.props.loading).toBe(false);
});

test('a failed resend shows the error message', async () => {
  const tree = await reachCodeStage();
  mockPrepareEmail.mockRejectedValueOnce(new Error('network'));

  pressResend(tree);
  await settle();
  expect(allText(tree)).toContain(en.signup.resendFailed);
});

test('after a failed resend, Resend code stays enabled and a retry clears the error', async () => {
  const tree = await reachCodeStage();
  mockPrepareEmail.mockRejectedValueOnce(new Error('network'));
  pressResend(tree);
  await settle();
  expect(buttonWithTitle(tree, en.signup.resendCode)!.props.disabled).toBe(false);

  pressResend(tree);
  await settle();
  expect(mockPrepareEmail).toHaveBeenCalledTimes(2);
  expect(allText(tree)).not.toContain(en.signup.resendFailed);
});
