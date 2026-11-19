// Sign up / sign in screen (PHASE2_ROWS.md row 1) — the DevSignup fallback
// rendered when isClerkEnabled() is false (no Clerk key: Expo Go local dev).
// Every other signup render test forces isClerkEnabled to true, so this
// branch had no coverage. This EXECUTES the real screen; it is not a
// source-text grep. @clerk/clerk-expo is mocked only because signup.tsx
// imports it unconditionally — its hooks are never called on this branch.
import SignupScreen from '@/app/onboarding/signup';
import { allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => false,
}));

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  useSignUp: () => ({ signUp: undefined, setActive: jest.fn(), isLoaded: true }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

test('renders the dev-mode fallback, not the Clerk sign-in flow', () => {
  const tree = renderScreen(<SignupScreen />);
  const text = allText(tree);

  expect(text).toContain('Local dev auth mode — no Clerk key configured');
  expect(buttonWithTitle(tree, 'Continue with Apple')).toBeDefined();
  // "Already have an account? Sign in" only exists on the Clerk branch.
  expect(text).not.toContain('Already have an account?');
});
