// Onboarding "Cuisine" step — multi-select tiles with a Continue button,
// disabled until at least one is picked. These EXECUTE the screen; they are
// not source-text greps.
import CuisineScreen from '@/app/onboarding/cuisine';
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
])('%s: the title, subtitle, every tile and Continue read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const c = locale.onboarding.cuisine;
  const tree = renderScreen(<CuisineScreen />);
  const text = allText(tree);

  expect(text).toContain(c.title);
  expect(text).toContain(c.subtitle);
  for (const label of Object.values(c.options)) {
    expect(findAll(tree, (p) => p.accessibilityLabel === label)[0]).toBeDefined();
  }
  expect(buttonWithTitle(tree, locale.onboarding.measurements.continue)).toBeDefined();
  if (lng !== 'en') {
    const english = en.onboarding.cuisine;
    expect(text).not.toContain(english.title);
    expect(text).not.toContain(english.subtitle);
    for (const label of Object.values(english.options)) {
      expect(findAll(tree, (p) => p.accessibilityLabel === label)).toHaveLength(0);
    }
  }
});

test('the headline renders', () => {
  const tree = renderScreen(<CuisineScreen />);
  expect(allText(tree)).toContain('What do you usually eat?');
});

test('picking a cuisine then pressing Continue navigates to the next onboarding route', () => {
  const tree = renderScreen(<CuisineScreen />);
  const tile = findAll(tree, (p) => p.accessibilityLabel === 'South Asian')[0];
  act(() => (tile.props.onPress as () => void)());

  const cont = buttonWithTitle(tree, 'Continue');
  act(() => (cont!.props.onPress as () => void)());

  expect(router.push).toHaveBeenCalledWith('/onboarding/dietary');
});
