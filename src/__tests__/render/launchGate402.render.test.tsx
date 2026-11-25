// Launch gate (src/app/index.tsx) to paywall, PHASE4_ROWS.md row 6b. A
// signed-in user with no completion flag asks GET /api/onboarding. A 402 means
// no plan grants access: the gate opens the paywall with the refusal reason,
// and the paywall shows the matching English message. A 401 keeps its routing
// to sign-in. Clerk, billing and the API client are mocked; no network.
import { Text } from 'react-native';
import { router } from 'expo-router';

import Index from '@/app/index';
import PaywallScreen from '@/app/onboarding/paywall';
import { showToast } from '@/components/display/toastStore';
import { AppStateProvider } from '@/lib/auth/appState';
import { registerSignOutExecutor } from '@/lib/auth/signOutSeam';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, allText, renderScreen } from './helpers';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
    Redirect: ({ href }: { href: string }) => <MockText>{`redirect:${href}`}</MockText>,
    useLocalSearchParams: () => mockParams,
    usePathname: () => '/',
    Href: {},
  };
});

jest.mock('@/components/display/toastStore', () => ({
  ...jest.requireActual('@/components/display/toastStore'),
  showToast: jest.fn(),
}));

jest.mock('@/lib/auth/clerkEnv', () => ({ isClerkEnabled: () => true }));
jest.mock('@clerk/clerk-expo', () => ({ useAuth: () => ({ isSignedIn: true }) }));

jest.mock('@/lib/storage/secureStore', () => ({
  ...jest.requireActual('@/lib/storage/secureStore'),
  getHasCompletedOnboarding: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/billing/purchases', () => ({
  isBillingEnabled: () => true,
  presentPaywall: jest.fn().mockResolvedValue('cancelled'),
  restorePurchases: jest.fn().mockResolvedValue(null),
  hasProEntitlement: () => false,
  TRIAL_DAYS: 7,
}));

const mockGet = jest.fn();
jest.mock('@/lib/api', () => ({
  sleep: () => Promise.resolve(),
  api: {
    onboarding: { get: (...args: unknown[]) => mockGet(...args), post: jest.fn() },
    subscription: { get: jest.fn() },
  },
  ApiError: class ApiError extends Error {},
}));

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const RESUME_STEP = '/onboarding/measurements';

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
}

async function destination(): Promise<string> {
  const tree = renderScreen(
    <AppStateProvider>
      <Index />
    </AppStateProvider>,
  );
  await settle();
  const redirect = tree.root.findAllByType(Text).find((n) => String(n.props.children).startsWith('redirect:'));
  return redirect ? String(redirect.props.children).slice('redirect:'.length) : allText(tree);
}

beforeEach(() => {
  mockGet.mockReset();
  mockSignOut.mockClear();
  mockParams = {};
  registerSignOutExecutor(mockSignOut);
  jest.mocked(showToast).mockClear();
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setLastStep(RESUME_STEP);
});

afterAll(() => registerSignOutExecutor(null));

test('a 402 with a reason opens the paywall, which shows that refusal message', async () => {
  mockGet.mockRejectedValueOnce(Object.assign(new Error('subscription required'), { status: 402, reason: 'expired' }));

  const href = await destination();
  expect(href).toBe('/onboarding/paywall?reason=expired');

  mockParams = Object.fromEntries(new URLSearchParams(href.split('?')[1]));
  renderScreen(<PaywallScreen />);
  await settle();
  expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.paywall.refusal.expired, tone: 'error' });
  expect(mockSignOut).not.toHaveBeenCalled();
});

test('a 401 still clears the session and opens sign-in, not the paywall', async () => {
  mockGet.mockRejectedValueOnce(Object.assign(new Error('invalid token'), { status: 401 }));

  const href = await destination();
  expect(href).not.toContain('/onboarding/paywall');
  expect(mockSignOut).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledWith('/onboarding/signup?mode=signin');
});

test('the paywall opened without a reason shows no refusal message', async () => {
  renderScreen(<PaywallScreen />);
  await settle();
  expect(showToast).not.toHaveBeenCalled();
});
