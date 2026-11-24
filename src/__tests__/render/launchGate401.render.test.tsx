// Launch gate (src/app/index.tsx), PHASE4_ROWS.md row 2b step 1e. EXECUTES the
// real gate for a signed-in user whose device has no completion flag, so it
// asks GET /api/onboarding. A 401 means the session is not valid: sign in
// again, never resume onboarding. A network error and a successful check keep
// their routing. Clerk and the API client are mocked; no network.
import { Text } from 'react-native';

import Index from '@/app/index';
import { showToast } from '@/components/display/toastStore';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, allText, renderScreen } from './helpers';

jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
    Redirect: ({ href }: { href: string }) => <MockText>{`redirect:${href}`}</MockText>,
    useLocalSearchParams: () => ({}),
    usePathname: () => '/',
    Href: {},
  };
});

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ isSignedIn: true }),
}));

jest.mock('@/lib/storage/secureStore', () => ({
  ...jest.requireActual('@/lib/storage/secureStore'),
  getHasCompletedOnboarding: jest.fn().mockResolvedValue(false),
}));

const mockGet = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { onboarding: { get: (...args: unknown[]) => mockGet(...args) } },
}));

const RESUME_STEP = '/onboarding/measurements';
const SIGN_IN = '/onboarding/signup?mode=signin';

async function destination(): Promise<string> {
  const tree = renderScreen(<Index />);
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  const redirect = tree.root.findAllByType(Text).find((n) => String(n.props.children).startsWith('redirect:'));
  return redirect ? String(redirect.props.children).slice('redirect:'.length) : allText(tree);
}

beforeEach(() => {
  mockGet.mockReset();
  jest.mocked(showToast).mockClear();
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setLastStep(RESUME_STEP);
});

test('a 401 goes to sign-in with the session expired message, not back into onboarding', async () => {
  mockGet.mockRejectedValueOnce(Object.assign(new Error('invalid token'), { status: 401 }));

  expect(await destination()).toBe(SIGN_IN);
  expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.sessionExpired, tone: 'error' });
  expect(useOnboardingStore.getState().last_step).toBe(RESUME_STEP);
  expect(useOnboardingStore.getState().completed).toBe(false);
});

test('a network error keeps resuming onboarding at the saved step', async () => {
  mockGet.mockRejectedValueOnce(new TypeError('Network request failed'));

  expect(await destination()).toBe(RESUME_STEP);
  expect(showToast).not.toHaveBeenCalled();
});

test('an onboarded user goes to the tabs', async () => {
  mockGet.mockResolvedValueOnce({ completed: true });

  expect(await destination()).toBe('/(tabs)');
  expect(useOnboardingStore.getState().completed).toBe(true);
});

test('a user who has not finished onboarding resumes at the saved step', async () => {
  mockGet.mockResolvedValueOnce({ completed: false });

  expect(await destination()).toBe(RESUME_STEP);
  expect(showToast).not.toHaveBeenCalled();
});
