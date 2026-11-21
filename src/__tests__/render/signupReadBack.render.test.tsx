// Signup → onboarding GET read-back (PHASE2_ROWS.md row 2) — EXECUTES the
// real screen's sign-in path, not just its render. Row 2's own API column
// says `api.onboarding.get` is read back in signup.tsx; signup.render.test.tsx
// only checks the legal links and the primary CTA's presence, never that a
// successful sign-in reads the status back. This drives that path. Clerk's
// SSO hook is mocked to resolve a session (no real Clerk call is possible
// here); `@/lib/api` is mocked so no live network call is possible either.
import SignupScreen from '@/app/onboarding/signup';
import { act, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({
    startSSOFlow: jest.fn().mockResolvedValue({
      createdSessionId: 'sess_test',
      setActive: jest.fn().mockResolvedValue(undefined),
    }),
  }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
  useSignUp: () => ({ signUp: undefined, setActive: jest.fn(), isLoaded: true }),
}));

const mockGet = jest.fn().mockResolvedValue({ completed: false });
jest.mock('@/lib/api', () => ({
  api: { onboarding: { get: (...args: unknown[]) => mockGet(...args) } },
}));

async function signInWithApple(): Promise<void> {
  const tree = renderScreen(<SignupScreen />);
  const cta = buttonWithTitle(tree, 'Continue with Apple')!;
  await act(async () => {
    (cta.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

beforeEach(() => {
  mockGet.mockClear();
});

test('a successful sign-in reads back the onboarding status exactly once', async () => {
  await signInWithApple();
  expect(mockGet).toHaveBeenCalledTimes(1);
});
