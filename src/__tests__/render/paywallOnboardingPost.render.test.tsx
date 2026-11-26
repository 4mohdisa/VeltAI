// Paywall → onboarding POST (PHASE2_ROWS.md row 2) — EXECUTES the real
// screen's purchase CTA, not just its render. Row 2's own API column says
// `api.onboarding.post` fires only at paywall.tsx; paywall.render.test.tsx
// only checks that the screen renders, never that pressing the CTA posts.
// This presses it. The RevenueCat purchase module is mocked (no live store
// call is possible here); `@/lib/api` is mocked so no live network call is
// possible either.
import PaywallScreen from '@/app/onboarding/paywall';
import { showToast } from '@/components/display/toastStore';
import { router } from 'expo-router';
import { purchasePackage } from '@/lib/purchases/revenuecat';
import i18n from '@/lib/i18n';
import { WINBACK_REASON } from '@/lib/nav';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { useSettingsStore } from '@/lib/settings/store';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

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
  purchasePackage: jest.fn(),
  getEntitlementState: () => Promise.resolve('active'),
  restorePurchases: jest.fn(),
  isEntitledState: jest.requireActual('@/lib/purchases/revenuecat').isEntitledState,
}));
jest.mock('@/components/display/LoadingSkeleton', () => ({ SkeletonList: () => null }));

const mockPost = jest.fn().mockResolvedValue({ completed: true });
const mockOnboardingGet = jest.fn();
const mockSubscription = jest.fn();
const mockSleep = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/api', () => ({
  sleep: (ms: number) => mockSleep(ms),
  api: {
    onboarding: { get: () => mockOnboardingGet(), post: (...args: unknown[]) => mockPost(...args) },
    subscription: { get: () => mockSubscription() },
  },
  ApiError: class ApiError extends Error {
    status: number;
    reason?: string;
    constructor(status: number, message: string, gate?: { reason?: string }) {
      super(message);
      this.status = status;
      this.reason = gate?.reason;
    }
  },
}));

const activeSubscription = { status: 'active', is_active: true, platform: 'ios', plan_interval: 'month', expires_at: null };
const noSubscription = { status: 'none', is_active: false, platform: null, plan_interval: null, expires_at: null };

jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

const plansLoaded = () => act(async () => new Promise((r) => setImmediate(r)));

// The purchase button shows once the plans have loaded. Its label is English
// only for now, so it is the same in every locale.
async function pressContinue(title = en.onboarding.paywall.subscribe, tree = renderScreen(<PaywallScreen />)): Promise<void> {
  await plansLoaded();
  const cta = buttonWithTitle(tree, title)!;
  await act(async () => {
    (cta.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

// Every paywall sentence the screen shows with billing on, Mediterranean and
// South Asian picked and halal on.
function screenStrings(l: Locale): string[] {
  const p = l.onboarding.paywall;
  const cuisines = `${l.onboarding.cuisine.options.south_asian}, ${l.onboarding.cuisine.options.mediterranean}`;
  return [
    p.title,
    p.features.unlimitedLogging,
    p.features.scanning,
    p.features.aiBrain,
    p.features.cuisineDatabase.replace('{{cuisines}}', cuisines),
    p.features.gym,
    p.features.halal,
    p.restore,
    l.signup.legalTerms,
    l.signup.legalPrivacy,
  ];
}

// Every console.error is recorded and must stay empty: a stray act() warning
// means a test left a state update running after it finished.
let consoleErrors: unknown[][];
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  consoleErrors = [];
  errorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args);
  });
  useOnboardingStore.getState().reset();
  mockPost.mockClear();
  mockSubscription.mockReset().mockResolvedValue(activeSubscription);
  mockSleep.mockClear();
  (purchasePackage as jest.Mock).mockReset().mockResolvedValue({ kind: 'purchased' });
  (showToast as jest.Mock).mockClear();
  useOnboardingStore.getState().setMeasurements({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80 });
  useOnboardingStore.getState().setActivity('moderate');
  useOnboardingStore.getState().setGoal('lose');
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
  errorSpy.mockRestore();
  expect(consoleErrors).toEqual([]);
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: every paywall line, the CTA and the purchase toast read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  useOnboardingStore.getState().setCuisines(['south_asian', 'mediterranean']);
  useOnboardingStore.getState().setDietaryReqs(['halal']);
  const tree = renderScreen(<PaywallScreen />);
  await plansLoaded();
  const text = allText(tree);

  for (const s of screenStrings(locale)) expect(text).toContain(s);
  expect(buttonWithTitle(tree, en.onboarding.paywall.subscribe)).toBeDefined();

  await pressContinue();
  expect(showToast).toHaveBeenCalledWith({ message: locale.subscription.welcomePro, tone: 'success' });

  if (lng !== 'en') {
    const translated = screenStrings(locale);
    for (const s of screenStrings(en).filter((e) => !translated.includes(e))) expect(text).not.toContain(s);
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ message: en.subscription.welcomePro }));
  }
});

test('with no cuisines picked the database line is the personalised one', async () => {
  const tree = renderScreen(<PaywallScreen />);
  await plansLoaded();
  const text = allText(tree);
  expect(text).toContain(en.onboarding.paywall.features.personalisedDatabase);
  expect(text).not.toContain(en.onboarding.paywall.features.halal);
});

test('es: a failed submit shows the translated setup error', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  mockPost.mockRejectedValueOnce(new Error('network'));
  await pressContinue();
  expect(showToast).toHaveBeenCalledWith({ message: es.onboarding.paywall.submitFailed, tone: 'error' });
});

test('pressing the primary CTA posts the onboarding payload exactly once', async () => {
  await pressContinue();
  expect(mockPost).toHaveBeenCalledTimes(1);
});

test('the posted payload matches the onboarding store answers', async () => {
  await pressContinue();
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      age: 30,
      sex: 'male',
      height: 180,
      weight: 80,
      activity_level: 'moderate',
      goal: 'lose',
    }),
  );
});

// --- Hard paywall: no free tier ---------------------------------------------
// The answers are saved only once the backend confirms a trial or an active
// plan. A dismissed paywall saves nothing and keeps the answers on the device.

test('a confirmed purchase saves the answers once and completes onboarding', async () => {
  await pressContinue();
  expect(mockSubscription).toHaveBeenCalledTimes(1);
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(useOnboardingStore.getState().completed).toBe(true);
});

test('dismissing the paywall never saves and keeps the answers on the device', async () => {
  (purchasePackage as jest.Mock).mockResolvedValue({ kind: 'cancelled' });
  await pressContinue();
  expect(mockPost).not.toHaveBeenCalled();
  expect(mockSubscription).not.toHaveBeenCalled();
  const kept = useOnboardingStore.getState();
  expect(kept.completed).toBe(false);
  expect(kept.goal).toBe('lose');
  expect(kept.activity_level).toBe('moderate');
});

test('dismissing, then purchasing later, saves the kept answers once', async () => {
  (purchasePackage as jest.Mock).mockResolvedValueOnce({ kind: 'cancelled' }).mockResolvedValueOnce({ kind: 'purchased' });
  const tree = renderScreen(<PaywallScreen />);
  await pressContinue(en.onboarding.paywall.subscribe, tree);
  expect(mockPost).not.toHaveBeenCalled();
  await pressContinue(en.onboarding.paywall.subscribe, tree);
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(mockPost).toHaveBeenCalledWith(expect.objectContaining({ goal: 'lose', activity_level: 'moderate', age: 30 }));
});

test('a purchase the backend has not confirmed yet does not save and says so', async () => {
  mockSubscription.mockResolvedValue(noSubscription);
  await pressContinue();
  expect(mockPost).not.toHaveBeenCalled();
  expect(useOnboardingStore.getState().completed).toBe(false);
  expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.paywall.notConfirmed, tone: 'info' });
});

// --- Confirmation retry -----------------------------------------------------
// Right after a purchase the backend may not have the webhook yet, so the
// check runs up to 4 times, 1.5 s apart. sleep is mocked: no test waits.

test('a purchase confirmed on a later check saves once', async () => {
  mockSubscription
    .mockResolvedValueOnce(noSubscription)
    .mockRejectedValueOnce(new Error('network'))
    .mockResolvedValue(activeSubscription);
  await pressContinue();
  expect(mockSubscription).toHaveBeenCalledTimes(3);
  expect(mockSleep).toHaveBeenCalledTimes(2);
  expect(mockSleep).toHaveBeenCalledWith(1500);
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(useOnboardingStore.getState().completed).toBe(true);
});

test('a purchase no check confirms saves nothing and shows the message', async () => {
  mockSubscription.mockResolvedValue(noSubscription);
  await pressContinue();
  expect(mockSubscription).toHaveBeenCalledTimes(4);
  expect(mockSleep).toHaveBeenCalledTimes(3);
  expect(mockPost).not.toHaveBeenCalled();
  expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.paywall.notConfirmed, tone: 'info' });
});

test('a dismissal makes no subscription check and never waits', async () => {
  (purchasePackage as jest.Mock).mockResolvedValue({ kind: 'cancelled' });
  await pressContinue();
  expect(mockSubscription).not.toHaveBeenCalled();
  expect(mockSleep).not.toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
});

// --- Refusal reasons (row 6b step d) ----------------------------------------
// A 402 from the save names why access was refused; the screen shows the
// matching English message, and an unknown or missing reason uses storeError.

test.each(Object.entries(en.onboarding.paywall.refusal))(
  'a 402 with reason %s shows its message',
  async (reason, message) => {
    const { ApiError } = jest.requireMock('@/lib/api');
    mockPost.mockRejectedValueOnce(new ApiError(402, 'subscription required', { reason }));
    await pressContinue();
    expect(showToast).toHaveBeenCalledWith({ message, tone: 'error' });
    expect(useOnboardingStore.getState().completed).toBe(false);
  },
);

test.each([['an unknown reason', 'something_new'], ['no reason', undefined]])(
  'a 402 with %s shows the store error',
  async (_label, reason) => {
    const { ApiError } = jest.requireMock('@/lib/api');
    mockPost.mockRejectedValueOnce(new ApiError(402, 'subscription required', { reason }));
    await pressContinue();
    expect(showToast).toHaveBeenCalledWith({ message: en.onboarding.paywall.storeError, tone: 'error' });
  },
);

// --- Refresh after purchase (row 6b step e) ---------------------------------

test('a confirmed purchase refreshes the stored entitlement once', async () => {
  useSettingsStore.getState().setServerEntitlement({ isActive: false, status: 'none' });
  const setEntitlement = jest.spyOn(useSettingsStore.getState(), 'setServerEntitlement');
  await pressContinue();
  expect(setEntitlement).toHaveBeenCalledTimes(1);
  expect(useSettingsStore.getState().serverEntitlement).toEqual(expect.objectContaining({ isActive: true }));
  setEntitlement.mockRestore();
});

// --- Resubscribe while still signed in (Row 14b Fix 5 follow-up) -------------
// The device still holds the finished onboarding answers. The server already has
// them, so the win back purchase enters the app without posting them again.

test('a signed-in user who resubscribes from win back enters the app without re-posting the answers', async () => {
  useOnboardingStore.getState().markCompleted();
  mockOnboardingGet.mockResolvedValue({ completed: true });
  const params = jest
    .spyOn(jest.requireMock<typeof import('expo-router')>('expo-router'), 'useLocalSearchParams')
    .mockReturnValue({ reason: WINBACK_REASON });
  jest.mocked(router.push).mockClear();
  await pressContinue();
  params.mockRestore();

  expect(mockPost).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalledWith('/onboarding/done');
  expect(router.replace).toHaveBeenCalledWith('/(tabs)');
});
