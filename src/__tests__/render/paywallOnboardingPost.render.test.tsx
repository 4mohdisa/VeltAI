// Paywall → onboarding POST (PHASE2_ROWS.md row 2) — EXECUTES the real
// screen's purchase CTA, not just its render. Row 2's own API column says
// `api.onboarding.post` fires only at paywall.tsx; paywall.render.test.tsx
// only checks that the screen renders, never that pressing the CTA posts.
// This presses it. The RevenueCat purchase module is mocked (no live store
// call is possible here); `@/lib/api` is mocked so no live network call is
// possible either.
import PaywallScreen from '@/app/onboarding/paywall';
import { showToast } from '@/components/display/toastStore';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/billing/purchases', () => ({
  isBillingEnabled: () => true,
  presentPaywall: jest.fn().mockResolvedValue('purchased'),
  restorePurchases: jest.fn().mockResolvedValue(null),
  hasProEntitlement: () => false,
  TRIAL_DAYS: 7,
}));

const mockPost = jest.fn().mockResolvedValue({ completed: true });
jest.mock('@/lib/api', () => ({
  api: { onboarding: { post: (...args: unknown[]) => mockPost(...args) } },
  ApiError: class ApiError extends Error {},
}));

jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

async function pressContinue(title = en.onboarding.paywall.seePlans): Promise<void> {
  const tree = renderScreen(<PaywallScreen />);
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
    p.trialNote.replace('{{days}}', '7'),
    p.restore,
    l.signup.legalTerms,
    l.signup.legalPrivacy,
  ];
}

beforeEach(() => {
  useOnboardingStore.getState().reset();
  mockPost.mockClear();
  (showToast as jest.Mock).mockClear();
  useOnboardingStore.getState().setMeasurements({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80 });
  useOnboardingStore.getState().setActivity('moderate');
  useOnboardingStore.getState().setGoal('lose');
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
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
  const text = allText(tree);

  for (const s of screenStrings(locale)) expect(text).toContain(s);
  expect(buttonWithTitle(tree, locale.onboarding.paywall.seePlans)).toBeDefined();

  await pressContinue(locale.onboarding.paywall.seePlans);
  expect(showToast).toHaveBeenCalledWith({ message: locale.subscription.welcomePro, tone: 'success' });

  if (lng !== 'en') {
    const translated = screenStrings(locale);
    for (const s of screenStrings(en).filter((e) => !translated.includes(e))) expect(text).not.toContain(s);
    expect(buttonWithTitle(tree, en.onboarding.paywall.seePlans)).toBeUndefined();
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ message: en.subscription.welcomePro }));
  }
});

test('with no cuisines picked the database line is the personalised one', () => {
  const text = allText(renderScreen(<PaywallScreen />));
  expect(text).toContain(en.onboarding.paywall.features.personalisedDatabase);
  expect(text).not.toContain(en.onboarding.paywall.features.halal);
});

test('es: a failed submit shows the translated setup error', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  mockPost.mockRejectedValueOnce(new Error('network'));
  await pressContinue(es.onboarding.paywall.seePlans);
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
