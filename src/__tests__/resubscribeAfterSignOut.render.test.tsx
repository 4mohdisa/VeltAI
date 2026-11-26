// Row 14b Fix 5: resubscribe from Profile after sign-out. Sign-out empties the
// onboarding store (resetAllStores) and nothing fills it again, so a returning
// user who buys from the win back paywall must enter the app on the server's
// existing onboarding record, not fail the answer check on an empty store.
import { router } from 'expo-router';

import PaywallScreen from '@/app/onboarding/paywall';
import { showToast } from '@/components/display/toastStore';
import { resetAllStores } from '@/lib/auth/resetRegistry';
import en from '@/lib/i18n/locales/en.json';
import { WINBACK_REASON } from '@/lib/nav';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, buttonWithTitle, renderScreen } from './render/helpers';

jest.mock('@/lib/billing/purchases', () => ({
  isBillingEnabled: () => true,
  TRIAL_DAYS: 7,
}));
jest.mock('@/lib/purchases/revenuecat', () => ({
  getOfferings: () =>
    Promise.resolve([
      {
        identifier: 'default',
        packages: [
          { identifier: '$rc_monthly', productId: 'monthly', priceString: '$9.99', periodLabel: 'Monthly', trialEligible: false },
        ],
      },
    ]),
  purchasePackage: () => Promise.resolve({ kind: 'purchased' }),
  getEntitlementState: () => Promise.resolve('active'),
  restorePurchases: jest.fn(),
  isEntitledState: jest.requireActual('@/lib/purchases/revenuecat').isEntitledState,
}));
jest.mock('@/components/display/LoadingSkeleton', () => ({ SkeletonList: () => null }));
jest.mock('@/components/display/toastStore', () => ({
  ...jest.requireActual('@/components/display/toastStore'),
  showToast: jest.fn(),
}));

const mockPost = jest.fn();
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  sleep: () => Promise.resolve(),
  api: {
    onboarding: { get: () => Promise.resolve({ completed: true }), post: (...args: unknown[]) => mockPost(...args) },
    subscription: {
      get: () =>
        Promise.resolve({ status: 'active', is_active: true, platform: 'ios', plan_interval: 'month', expires_at: null }),
    },
  },
}));

const settle = () => act(async () => new Promise((r) => setImmediate(r)));

test('a returning user who resubscribes after sign-out enters the app without re-posting onboarding', async () => {
  useOnboardingStore.getState().setMeasurements({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80 });
  useOnboardingStore.getState().setActivity('moderate');
  useOnboardingStore.getState().setGoal('lose');
  useOnboardingStore.getState().markCompleted();
  await resetAllStores();

  jest
    .spyOn(jest.requireMock<typeof import('expo-router')>('expo-router'), 'useLocalSearchParams')
    .mockReturnValue({ reason: WINBACK_REASON });
  const tree = renderScreen(<PaywallScreen />);
  await settle();
  await act(async () => {
    (buttonWithTitle(tree, en.onboarding.paywall.subscribe)!.props.onPress as () => void)();
  });
  await settle();

  expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ tone: 'error' }));
  expect(mockPost).not.toHaveBeenCalled();
  expect(useOnboardingStore.getState().completed).toBe(true);
  expect(router.replace).toHaveBeenCalledWith('/(tabs)');
});
