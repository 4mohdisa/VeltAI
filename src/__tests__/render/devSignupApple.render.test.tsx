// The dev auth fallback (no Clerk key) uses AppleSignInButton, so Apple shows
// on iOS and is hidden on Android, the same as the Clerk branch. Clerk is
// mocked only because signup.tsx imports it; this branch never calls it.
import { Platform } from 'react-native';

import SignupScreen from '@/app/onboarding/signup';
import { AppleSignInButton } from '@/components/onboarding/AppleSignInButton';
import en from '@/lib/i18n/locales/en.json';
import { buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => false,
}));

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({ signUp: undefined, setActive: jest.fn(), isLoaded: true }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

const apple = en.signup.continueApple;

afterEach(() => {
  jest.restoreAllMocks();
});

test('iOS: the dev fallback renders AppleSignInButton', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  const tree = renderScreen(<SignupScreen />);
  expect(tree.root.findAllByType(AppleSignInButton)).toHaveLength(1);
  expect(buttonWithTitle(tree, apple)).toBeDefined();
});

test('Android: the dev fallback shows no Apple button', () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const tree = renderScreen(<SignupScreen />);
  expect(buttonWithTitle(tree, apple)).toBeUndefined();
  expect(buttonWithTitle(tree, en.signup.continueGoogle)).toBeDefined();
});
