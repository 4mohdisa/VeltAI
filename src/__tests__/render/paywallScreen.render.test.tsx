// Onboarding paywall (Row 7b) on the purchases wrapper. EXECUTES the screen;
// src/lib/purchases/revenuecat.ts is mocked, so no SDK and no store call.
// Covers loading, error with Try again, cancelled, purchased, not configured,
// trial eligible and not, restore with and without a subscription, and the
// Terms and Privacy links.
import { router } from 'expo-router';

import PaywallScreen from '@/app/onboarding/paywall';
import { showToast } from '@/components/display/toastStore';
import en from '@/lib/i18n/locales/en.json';
import { getEntitlementState, getOfferings, purchasePackage, restorePurchases } from '@/lib/purchases/revenuecat';
import type { Offering } from '@/lib/purchases/types';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, allText, buttonWithTitle, findAll, renderScreen, screenTitle } from './helpers';

let mockBilling = true;
let mockDevBuild = true;
jest.mock('@/lib/billing/purchases', () => ({
  isBillingEnabled: () => mockBilling,
  TRIAL_DAYS: 7,
}));
jest.mock('@/lib/env', () => ({ ...jest.requireActual('@/lib/env'), isDevBuild: () => mockDevBuild }));
jest.mock('@/lib/purchases/revenuecat', () => ({
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  getEntitlementState: jest.fn(),
  isEntitledState: jest.requireActual('@/lib/purchases/revenuecat').isEntitledState,
}));
jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));
// A host stand-in the test can find (the real Skeleton needs reanimated's useReducedMotion).
jest.mock('@/components/display/LoadingSkeleton', () => ({
  SkeletonList: () => jest.requireActual('react').createElement('View', { testID: 'skeleton' }),
}));

const mockPost = jest.fn();
jest.mock('@/lib/api', () => ({
  sleep: () => Promise.resolve(),
  api: {
    onboarding: { post: (...args: unknown[]) => mockPost(...args) },
    subscription: {
      get: () => Promise.resolve({ status: 'active', is_active: true, platform: 'ios', plan_interval: 'month', expires_at: null }),
    },
  },
  ApiError: class ApiError extends Error {},
}));

const p = en.onboarding.paywall;
const trialLine = p.trialLine.replace('{{days}}', '7');
const monthlyLabel = p.packageLabel.replace('{{period}}', 'Monthly').replace('{{price}}', '$9.99');

const offering = (trialEligible: boolean): Offering => ({
  identifier: 'default',
  packages: [
    { identifier: '$rc_monthly', productId: 'lume_pro_monthly', priceString: '$9.99', periodLabel: 'Monthly', trialEligible },
    { identifier: '$rc_annual', productId: 'lume_pro_annual', priceString: '$59.99', periodLabel: 'Yearly', trialEligible },
  ],
});

const flush = () => act(async () => new Promise((r) => setImmediate(r)));

async function render() {
  const tree = renderScreen(<PaywallScreen />);
  await flush();
  return tree;
}

// A Button by title, an accessibility-labelled control, or the pressable that
// holds the text (the Restore and legal links).
const pressable = (tree: ReturnType<typeof renderScreen>, title: string) =>
  buttonWithTitle(tree, title) ??
  findAll(tree, (q) => typeof q.onPress === 'function').find(
    (n) => n.props.accessibilityLabel === title || n.findAll((c) => c.props.children === title).length > 0,
  );

async function press(tree: ReturnType<typeof renderScreen>, title: string) {
  const target = pressable(tree, title);
  await act(async () => {
    (target!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

beforeEach(() => {
  mockBilling = true;
  mockDevBuild = true;
  jest.mocked(getOfferings).mockReset().mockResolvedValue([offering(false)]);
  jest.mocked(purchasePackage).mockReset().mockResolvedValue({ kind: 'purchased' });
  jest.mocked(restorePurchases).mockReset().mockResolvedValue('none');
  jest.mocked(getEntitlementState).mockReset().mockResolvedValue('active');
  jest.mocked(showToast).mockClear();
  mockPost.mockReset().mockResolvedValue({ completed: true });
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setMeasurements({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80 });
  useOnboardingStore.getState().setActivity('moderate');
  useOnboardingStore.getState().setGoal('lose');
});

test('loading shows placeholder rows and no purchase button', async () => {
  jest.mocked(getOfferings).mockReturnValue(new Promise(() => {}));
  const tree = await render();
  expect(screenTitle(tree)).toBe(p.title);
  expect(findAll(tree, (q) => q.testID === 'skeleton')).toHaveLength(1);
  expect(buttonWithTitle(tree, p.subscribe)).toBeUndefined();
});

test('no plans shows the plans unavailable notice, and Try again loads them', async () => {
  jest.mocked(getOfferings).mockResolvedValueOnce([]);
  const tree = await render();
  expect(allText(tree)).toContain(p.plansUnavailable);
  expect(buttonWithTitle(tree, p.subscribe)).toBeUndefined();

  await press(tree, en.common.tryAgain);
  expect(getOfferings).toHaveBeenCalledTimes(2);
  expect(allText(tree)).not.toContain(p.plansUnavailable);
  expect(allText(tree)).toContain(monthlyLabel);
});

test('each package shows the store price and period', async () => {
  const tree = await render();
  expect(allText(tree)).toContain(monthlyLabel);
  expect(allText(tree)).toContain(p.packageLabel.replace('{{period}}', 'Yearly').replace('{{price}}', '$59.99'));
});

test('trial eligible: the trial line shows and the button starts the trial', async () => {
  jest.mocked(getOfferings).mockResolvedValue([offering(true)]);
  const tree = await render();
  expect(allText(tree)).toContain(trialLine);
  expect(buttonWithTitle(tree, p.startTrial)).toBeDefined();
});

test('not trial eligible: no trial line and the button says Subscribe', async () => {
  const tree = await render();
  expect(allText(tree)).not.toContain(trialLine);
  expect(buttonWithTitle(tree, p.startTrial)).toBeUndefined();
  expect(buttonWithTitle(tree, p.subscribe)).toBeDefined();
});

test('a cancelled purchase stays on the screen with no message and saves nothing', async () => {
  jest.mocked(purchasePackage).mockResolvedValue({ kind: 'cancelled' });
  const tree = await render();
  await press(tree, p.subscribe);

  expect(purchasePackage).toHaveBeenCalledWith(offering(false).packages[0]);
  expect(showToast).not.toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
  expect(screenTitle(tree)).toBe(p.title);
  expect(buttonWithTitle(tree, p.subscribe)!.props.loading).toBe(false);
});

test('a failed purchase shows the store error and saves nothing', async () => {
  jest.mocked(purchasePackage).mockResolvedValue({ kind: 'error', code: '2' });
  const tree = await render();
  await press(tree, p.subscribe);

  expect(showToast).toHaveBeenCalledWith({ message: p.storeError, tone: 'info' });
  expect(mockPost).not.toHaveBeenCalled();
});

test('a purchase of the selected package refreshes the entitlement, saves and moves on', async () => {
  const tree = await render();
  await press(tree, p.packageLabel.replace('{{period}}', 'Yearly').replace('{{price}}', '$59.99'));
  await press(tree, p.subscribe);

  expect(purchasePackage).toHaveBeenCalledWith(offering(false).packages[1]);
  expect(getEntitlementState).toHaveBeenCalled();
  expect(showToast).toHaveBeenCalledWith({ message: en.subscription.welcomePro, tone: 'success' });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/onboarding/done');
});

test('not configured in a release build shows plans unavailable and no purchase', async () => {
  mockBilling = false;
  mockDevBuild = false;
  const tree = await render();

  expect(allText(tree)).toContain(p.plansUnavailable);
  expect(getOfferings).not.toHaveBeenCalled();
  expect(buttonWithTitle(tree, p.subscribe)).toBeUndefined();
  expect(buttonWithTitle(tree, en.onboarding.measurements.continue)).toBeUndefined();
});

test('restore with a subscription says so, saves and moves on', async () => {
  jest.mocked(restorePurchases).mockResolvedValue('active');
  const tree = await render();
  await press(tree, p.restore);

  expect(showToast).toHaveBeenCalledWith({ message: en.profile.subscriptionRestored, tone: 'success' });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/onboarding/done');
});

test('restore with nothing to restore says so and saves nothing', async () => {
  const tree = await render();
  await press(tree, p.restore);

  expect(showToast).toHaveBeenCalledWith({ message: p.noSubscription, tone: 'info' });
  expect(mockPost).not.toHaveBeenCalled();
});

test('Terms and Privacy open the existing legal screens', async () => {
  const tree = await render();
  await press(tree, en.signup.legalTerms);
  await press(tree, en.signup.legalPrivacy);

  expect(router.push).toHaveBeenCalledWith('/legal/terms');
  expect(router.push).toHaveBeenCalledWith('/legal/privacy');
});
