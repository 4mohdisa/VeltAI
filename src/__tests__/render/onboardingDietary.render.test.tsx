// Onboarding "Dietary" step — multi-select pills with a Continue button.
// These EXECUTE the screen; they are not source-text greps.
import DietaryScreen from '@/app/onboarding/dietary';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { router } from 'expo-router';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

beforeEach(() => {
  useOnboardingStore.getState().reset();
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
])('%s: the title, subtitle, every option and Continue read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const d = locale.onboarding.dietary;
  const tree = renderScreen(<DietaryScreen />);
  const text = allText(tree);

  expect(text).toContain(d.title);
  expect(text).toContain(d.subtitle);
  for (const label of Object.values(d.options)) {
    expect(findAll(tree, (p) => p.accessibilityLabel === label)[0]).toBeDefined();
  }
  expect(buttonWithTitle(tree, locale.onboarding.measurements.continue)).toBeDefined();
  if (lng !== 'en') {
    const english = en.onboarding.dietary;
    expect(text).not.toContain(english.title);
    expect(text).not.toContain(english.subtitle);
    // "Halal" is the same word in every language, so only differing labels count.
    const translated = Object.values(d.options);
    for (const label of Object.values(english.options).filter((l) => !translated.includes(l))) {
      expect(findAll(tree, (p) => p.accessibilityLabel === label)).toHaveLength(0);
    }
  }
});

test('the headline renders', () => {
  const tree = renderScreen(<DietaryScreen />);
  expect(allText(tree)).toContain('Any dietary requirements?');
});

test('picking a dietary option then pressing Continue navigates to the next onboarding route', () => {
  const tree = renderScreen(<DietaryScreen />);
  const pill = findAll(tree, (p) => p.accessibilityLabel === 'Halal')[0];
  act(() => (pill.props.onPress as () => void)());

  const cont = buttonWithTitle(tree, 'Continue');
  act(() => (cont!.props.onPress as () => void)());

  expect(router.push).toHaveBeenCalledWith('/onboarding/preview');
});
