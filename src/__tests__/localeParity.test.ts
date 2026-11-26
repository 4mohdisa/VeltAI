/// <reference types="jest" />
// Row 29, i18n parity: en, es and fr carry the same keys, the same {{name}}
// placeholders per key, and only _one/_other plural pairs.
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';

type Flat = Map<string, string>;

function flatten(node: unknown, prefix = '', out: Flat = new Map()): Flat {
  if (node !== null && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.set(prefix, String(node));
  }
  return out;
}

const LOCALES: Record<string, Flat> = { en: flatten(en), es: flatten(es), fr: flatten(fr) };
const base = LOCALES.en;
const others = Object.entries(LOCALES).filter(([lang]) => lang !== 'en');

// English only, per Isa override 25 Nov: es and fr fall back to en for these.
const ENGLISH_ONLY = new Set([
  // The in-app Privacy Policy (src/app/legal/privacy.tsx), English only until legal review.
  ...flatten(en.legal.privacy, 'legal.privacy').keys(),
  // The in-app Terms of Service (src/app/legal/terms.tsx), English only until legal review.
  // Its health disclaimer stays translated.
  'legal.terms.title',
  'legal.terms.intro',
  'legal.terms.awaiting',
  ...flatten(en.legal.terms.sections, 'legal.terms.sections').keys(),
  // The paywall subscription terms (src/app/onboarding/paywall.tsx), English only until legal review.
  ...flatten(en.onboarding.paywall.terms, 'onboarding.paywall.terms').keys(),
  // The feature feedback chip (src/components/feedback/FeatureFeedbackChip.tsx).
  ...flatten(en.feedback.chip, 'feedback.chip').keys(),
  // English only for now: es and fr text waits for Isa.
  'aiQuery.consentNeeded',
  'gymSession.removeSet',
  'gymSession.noSets',
  'aiQuery.notEnoughData',
  'onboarding.measurements.targetRequired',
  'onboarding.targets.caloriesRange',
  'onboarding.measurements.heightRangeIn',
  'subscription.period.day_one',
  'subscription.period.day_other',
  'subscription.period.week_one',
  'subscription.period.week_other',
  'subscription.period.month_one',
  'subscription.period.month_other',
  'subscription.period.year_one',
  'subscription.period.year_other',
  'subscription.period.oneTime',
  'onboarding.paywall.subscribe',
  'onboarding.paywall.startTrial',
  'onboarding.paywall.packageLabel',
  'onboarding.paywall.trialLine',
  'subscription.billingProblem.message',
  'subscription.billingProblem.manage',
  'subscription.billingProblem.tryAgain',
  'subscription.expired.badge',
  'subscription.expired.body',
  'subscription.expired.resubscribe',
  'subscription.winback.title',
  'subscription.winback.body',
  'subscription.winback.price',
  'subscription.winback.notNow',
  'subscription.leaving.title',
  'notifications.priming.title',
  'notifications.priming.body',
  'notifications.priming.turnOn',
  'notifications.priming.notNow',
  'notifications.meal_reminder.title',
  'notifications.meal_reminder.label',
  'notifications.workout_reminder.title',
  'notifications.workout_reminder.label',
  'notifications.streak_at_risk.title',
  'notifications.streak_at_risk.label',
  'notifications.weekly_summary.title',
  'notifications.weekly_summary.label',
  'notifications.promotional.title',
  'notifications.promotional.label',
  'notifications.quietHours.label',
  'notifications.quietHours.value',
  'notifications.quietHours.start',
  'notifications.quietHours.end',
  'notifications.quietHours.sameTime',
  'common.decrease',
  'common.increase',
  'subscription.leaving.settingsRow',
  'subscription.leaving.usageTitle',
  'subscription.leaving.meals',
  'subscription.leaving.workouts',
  'subscription.leaving.streak',
  'subscription.leaving.emptyTitle',
  'subscription.leaving.emptyBody',
  'subscription.leaving.tryAgain',
  'subscription.leaving.reasonLabel',
  'subscription.leaving.reasons.too_expensive',
  'subscription.leaving.reasons.not_using',
  'subscription.leaving.reasons.missing_feature',
  'subscription.leaving.reasons.found_other',
  'subscription.leaving.reasons.not_working',
  'subscription.leaving.reasons.other',
  'subscription.leaving.send',
  'subscription.leaving.sent',
  'subscription.leaving.sendFailed',
  'subscription.leaving.keepPlan',
  'settings.privacyDetails.aiAllow',
  'settings.privacyDetails.aiConsentedOn',
  'settings.privacyDetails.dataTitle',
  'aiConsent.screen.eyebrow',
  'aiConsent.screen.title',
  'aiConsent.screen.whatTitle',
  'aiConsent.screen.what',
  'aiConsent.screen.whoTitle',
  'aiConsent.screen.who',
  'aiConsent.screen.whyTitle',
  'aiConsent.screen.why',
  'aiConsent.screen.withdraw',
  'aiConsent.screen.accept',
  'aiConsent.screen.decline',
  'aiConsent.screen.error',
  'onboarding.paywall.refusal.trial_ended',
  'onboarding.paywall.refusal.expired',
  'onboarding.paywall.refusal.billing_failed',
  'onboarding.paywall.refusal.cancelled_ended',
  'onboarding.paywall.refusal.refunded',
  'onboarding.paywall.refusal.not_subscribed',
  'settings.deleteAccountDetails.confirmWord',
  'settings.deleteAccountDetails.continue',
  'settings.deleteAccountDetails.understandContinue',
  'settings.deleteAccountDetails.confirmButton',
  'settings.deleteAccountDetails.sureTitle',
  'settings.deleteAccountDetails.sureBody',
  'settings.deleteAccountDetails.whatTitle',
  'settings.deleteAccountDetails.data.identity',
  'settings.deleteAccountDetails.data.profile',
  'settings.deleteAccountDetails.data.gym',
  'settings.deleteAccountDetails.data.food',
  'settings.deleteAccountDetails.data.ai',
  'settings.deleteAccountDetails.data.integrations',
  'settings.deleteAccountDetails.subscriptionNote',
  'settings.deleteAccountDetails.typeToConfirm',
  'settings.deleteAccountDetails.confirmLabel',
  'settings.deleteAccountDetails.deleted',
  'settings.deleteAccountDetails.failed',
  'onboarding.trainingDays.title',
  'onboarding.trainingDays.options.days_0',
  'onboarding.trainingDays.options.days_1_2',
  'onboarding.trainingDays.options.days_3_4',
  'onboarding.trainingDays.options.days_5_plus',
  'goals.plan.goal',
  'goals.plan.activity',
  'goals.plan.goalOptions.lose',
  'goals.plan.goalOptions.track',
  'goals.plan.goalOptions.muscle',
  'goals.plan.activityOptions.sedentary',
  'goals.plan.activityOptions.light',
  'goals.plan.activityOptions.moderate',
  'goals.plan.activityOptions.very_active',
  'goals.plan.saved',
  'goals.plan.saveFailed',
  // English only build
  'goals.plan.goalEatHealthier',
  'goals.plan.trainingDays',
  'goals.plan.trainingDaysSaved',
  'preferences.food.title',
  'preferences.food.dietary',
  'preferences.food.cuisines',
  'preferences.food.notSet',
  'preferences.food.loading',
  'preferences.food.loadFailed',
  'preferences.food.saved',
  'preferences.food.saveFailed',
  'onboarding.paywall.notConfirmed',
]);

const placeholders = (s: string) => [...new Set([...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]))].sort();

test('every locale has exactly the keys en has', () => {
  const missing: Record<string, { missingHere: string[]; missingInEn: string[] }> = {};
  for (const [lang, flat] of others) {
    const missingHere = [...base.keys()].filter((k) => !flat.has(k) && !ENGLISH_ONLY.has(k));
    const missingInEn = [...flat.keys()].filter((k) => !base.has(k));
    if (missingHere.length || missingInEn.length) missing[lang] = { missingHere, missingInEn };
  }
  expect(missing).toEqual({});
});

test('every key has the same placeholders in every locale', () => {
  const mismatched: Record<string, Record<string, string[]>> = {};
  for (const [key, value] of base) {
    const want = placeholders(value).join(',');
    for (const [lang, flat] of others) {
      const got = flat.get(key);
      if (got !== undefined && placeholders(got).join(',') !== want) {
        mismatched[key] = { ...mismatched[key], en: placeholders(value), [lang]: placeholders(got) };
      }
    }
  }
  expect(mismatched).toEqual({});
});

test('plurals are _one/_other pairs only', () => {
  const problems: Record<string, string[]> = {};
  for (const [lang, flat] of Object.entries(LOCALES)) {
    const bad = [...flat.keys()].filter(
      (k) =>
        /_(zero|two|few|many)$/.test(k) ||
        (k.endsWith('_one') && !flat.has(`${k.slice(0, -'_one'.length)}_other`)),
    );
    if (bad.length) problems[lang] = bad;
  }
  expect(problems).toEqual({});
});
