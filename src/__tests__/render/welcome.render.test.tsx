// Welcome screen (PHASE4_ROWS.md row 2b, steps 1a and 1c). EXECUTES the real
// Welcome and Signup screens: the headline, subline, Get Started button and
// Sign in link read from the locale file in en, es and fr; the link routes to
// /onboarding/signup?mode=signin and Signup opens in sign-in mode for that
// parameter. Get Started still routes to the goal step.
import WelcomeScreen from '@/app/onboarding/index';
import SignupScreen from '@/app/onboarding/signup';
import { router, useLocalSearchParams } from 'expo-router';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: () => '/onboarding',
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

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({ signUp: undefined, setActive: jest.fn(), isLoaded: true }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

const SIGN_IN_HREF = '/onboarding/signup?mode=signin';

function signInLink(tree: ReturnType<typeof renderScreen>) {
  return findAll(tree, (p) => p.accessibilityRole === 'link' && typeof p.onPress === 'function')[0];
}

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the headline, subline, button and Sign in link read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(<WelcomeScreen />);

  const text = allText(tree);
  expect(text).toContain(locale.onboarding.welcomeHeadline);
  expect(text).toContain(locale.onboarding.welcomeSubline);
  expect(buttonWithTitle(tree, locale.onboarding.welcomeGetStarted)).toBeDefined();
  expect(text).toContain(locale.onboarding.welcomeSignIn);
  expect(signInLink(tree)).toBeDefined();
  if (lng !== 'en') expect(text).not.toContain(en.onboarding.welcomeHeadline);
});

test('tapping Sign in opens the signup screen in sign-in mode', () => {
  const tree = renderScreen(<WelcomeScreen />);

  act(() => {
    (signInLink(tree).props.onPress as () => void)();
  });
  expect(router.push).toHaveBeenCalledWith(SIGN_IN_HREF);
});

test('signup opens in sign-in mode for ?mode=signin', () => {
  jest.mocked(useLocalSearchParams).mockReturnValueOnce({ mode: 'signin' });
  const text = allText(renderScreen(<SignupScreen />));

  expect(text).toContain('New to Lume? Create an account');
  expect(text).not.toContain('Already have an account? Sign in');
});

test('Get Started still routes to the goal step', () => {
  const tree = renderScreen(<WelcomeScreen />);

  (buttonWithTitle(tree, 'Get Started')!.props.onPress as () => void)();
  expect(router.push).toHaveBeenCalledWith('/onboarding/goal');
  expect(router.push).not.toHaveBeenCalledWith(SIGN_IN_HREF);
});
