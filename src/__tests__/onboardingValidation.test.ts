// validateOnboardingPayload messages read from the locale files, so the
// paywall's "finish setup" toast is in the user's language.
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { validateOnboardingPayload } from '@/lib/stores/onboarding';
import type { OnboardingSession } from '@/lib/types';

const complete: OnboardingSession = {
  goal: 'lose',
  activity_level: 'moderate',
  cuisines: [],
  dietary_requirements: [],
  age: 30,
  sex: 'male',
  height_cm: 180,
  weight_kg: 80,
  target_weight_kg: 75,
  calorie_target: null,
  body_type: null,
};

type Key = keyof typeof en.onboarding.validation;

const CASES: [Key, Partial<OnboardingSession>][] = [
  ['ageMissing', { age: null }],
  ['ageRange', { age: 12 }],
  ['sexMissing', { sex: null }],
  ['heightMissing', { height_cm: null }],
  ['heightRange', { height_cm: 99 }],
  ['weightMissing', { weight_kg: null }],
  ['weightRange', { weight_kg: 301 }],
  ['activityMissing', { activity_level: null }],
  ['goalMissing', { goal: null }],
  ['targetWeight', { target_weight_kg: 5000 }],
];

afterEach(async () => {
  await i18n.changeLanguage('en');
});

test('every validation key has a case', () => {
  expect(CASES.map(([k]) => k).sort()).toEqual(Object.keys(en.onboarding.validation).sort());
});

describe.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s', (lng, locale) => {
  test.each(CASES)('%s reads from the locale file', async (key, patch) => {
    await i18n.changeLanguage(lng);
    const msg = validateOnboardingPayload({ ...complete, ...patch });

    expect(msg).toBe(locale.onboarding.validation[key]);
    if (lng !== 'en') expect(msg).not.toBe(en.onboarding.validation[key]);
  });
});
