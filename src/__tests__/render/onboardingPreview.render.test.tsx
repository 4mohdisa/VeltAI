// Onboarding "Preview" step — reflects the user's answers back as insight
// cards, then the account CTA. These EXECUTE the screen; they are not
// source-text greps.
import PreviewScreen from '@/app/onboarding/preview';
import { TRIAL_DAYS } from '@/lib/billing/purchases';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { router } from 'expo-router';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

beforeEach(() => {
  useOnboardingStore.getState().reset();
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

const trialNote = (s: string) => s.replace('{{days}}', String(TRIAL_DAYS));

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: title, insight cards, CTA and trial note read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  useOnboardingStore.getState().setCuisines(['south_asian', 'mediterranean']);
  useOnboardingStore.getState().setDietaryReqs(['halal']);
  const p = locale.onboarding.preview;
  const tree = renderScreen(<PreviewScreen />);
  const text = allText(tree);

  for (const s of [
    p.title,
    p.cuisine.south_asian,
    p.cuisine.mediterranean,
    p.targets,
    p.portions,
    p.halal,
    trialNote(p.trialNote),
  ]) {
    expect(text).toContain(s);
  }
  expect(buttonWithTitle(tree, p.createAccount)).toBeDefined();

  if (lng !== 'en') {
    const e = en.onboarding.preview;
    for (const s of [
      e.title,
      e.cuisine.south_asian,
      e.cuisine.mediterranean,
      e.targets,
      e.portions,
      e.halal,
      trialNote(e.trialNote),
    ]) {
      expect(text).not.toContain(s);
    }
    expect(buttonWithTitle(tree, e.createAccount)).toBeUndefined();
  }
});

test('no cuisines and no halal: only the two always-on cards show', () => {
  const tree = renderScreen(<PreviewScreen />);
  const text = allText(tree);
  expect(text).toContain(en.onboarding.preview.targets);
  expect(text).toContain(en.onboarding.preview.portions);
  expect(text).not.toContain(en.onboarding.preview.halal);
  for (const s of Object.values(en.onboarding.preview.cuisine)) expect(text).not.toContain(s);
});

test('the headline renders', () => {
  const tree = renderScreen(<PreviewScreen />);
  expect(allText(tree)).toContain("Here's what Lume knows about you already");
});

test('pressing the account CTA navigates to the next onboarding route', () => {
  const tree = renderScreen(<PreviewScreen />);
  const cta = buttonWithTitle(tree, 'Create my account →');
  act(() => (cta!.props.onPress as () => void)());

  expect(router.push).toHaveBeenCalledWith('/onboarding/signup');
});
