// Sign up / sign in screen (PHASE2_ROWS.md row 1) — the SSO cancel and
// error paths in the sso() handler (src/app/onboarding/signup.tsx:156-179):
// a resolved flow with no createdSessionId shows 'Sign-in was cancelled.'
// and never calls setActive; a rejected flow shows clerkMessage(e). This
// EXECUTES the real screen; it is not a source-text grep. No real network,
// no real Clerk calls.
import SignupScreen from '@/app/onboarding/signup';
import { useToastStore } from '@/components/display/toastStore';
import { act, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const mockStartSSOFlow = jest.fn();
const mockSetActive = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: (...args: unknown[]) => mockStartSSOFlow(...args) }),
  useSignUp: () => ({ signUp: undefined, setActive: jest.fn(), isLoaded: true }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

beforeEach(() => {
  mockStartSSOFlow.mockClear();
  mockSetActive.mockClear();
  useToastStore.getState().dismiss();
});

test('a cancelled SSO flow (no created session) shows "Sign-in was cancelled." and never calls setActive', async () => {
  mockStartSSOFlow.mockResolvedValue({ createdSessionId: undefined, setActive: mockSetActive });

  const tree = renderScreen(<SignupScreen />);
  await act(async () => {
    (buttonWithTitle(tree, 'Continue with Apple')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(useToastStore.getState().current).toMatchObject({ message: 'Sign-in was cancelled.', tone: 'info' });
  expect(mockSetActive).not.toHaveBeenCalled();
});

test('a rejected SSO flow shows the message produced by clerkMessage', async () => {
  mockStartSSOFlow.mockRejectedValue({ errors: [{ code: 'form_identifier_exists', message: 'Email taken' }] });

  const tree = renderScreen(<SignupScreen />);
  await act(async () => {
    (buttonWithTitle(tree, 'Continue with Apple')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(useToastStore.getState().current).toMatchObject({
    message: 'That email already has an account — try signing in instead.',
    tone: 'error',
  });
});
