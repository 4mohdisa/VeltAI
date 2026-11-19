// Sign up / sign in screen (PHASE2_ROWS.md row 1) — EXECUTES the real screen,
// not a source-text grep. Clerk's hooks are mocked (no live Clerk session is
// possible in this environment); isClerkEnabled is forced true so the real
// ClerkSignup branch renders instead of the local-dev stub, since that is the
// path row 1 actually describes ("Clerk SDK (sign-in/sign-up)").
import SignupScreen from '@/app/onboarding/signup';
import { Pressable } from '@/components/primitives/Pressable';
import { allText, buttonWithTitle, renderScreen } from './render/helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
  useSignUp: () => ({ signUp: undefined, setActive: jest.fn(), isLoaded: true }),
}));

function legalLinks(tree: ReturnType<typeof renderScreen>) {
  return tree.root
    .findAllByType(Pressable)
    .filter((n) => n.props.accessibilityRole === 'link');
}

test('shows both legal links in the footer', () => {
  const tree = renderScreen(<SignupScreen />);
  const text = allText(tree);
  expect(text).toContain('Terms');
  expect(text).toContain('Privacy Policy');
});

test('pressing the Terms link routes to /legal/terms', () => {
  const tree = renderScreen(<SignupScreen />);
  const { router } = require('expo-router') as { router: { push: jest.Mock } };
  router.push.mockClear();

  legalLinks(tree)[0].props.onPress();
  expect(router.push).toHaveBeenCalledWith('/legal/terms');
});

test('pressing the Privacy Policy link routes to /legal/privacy', () => {
  const tree = renderScreen(<SignupScreen />);
  const { router } = require('expo-router') as { router: { push: jest.Mock } };
  router.push.mockClear();

  legalLinks(tree)[1].props.onPress();
  expect(router.push).toHaveBeenCalledWith('/legal/privacy');
});

test('renders the primary submit control', () => {
  const tree = renderScreen(<SignupScreen />);
  const cta = buttonWithTitle(tree, 'Continue with Apple');
  expect(cta).toBeDefined();
  expect(cta!.props.disabled).toBeFalsy();
});
