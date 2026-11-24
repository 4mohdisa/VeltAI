// Onboarding "Targets" step — shows the derived plan with a CTA that accepts
// it as-is. These EXECUTE the screen; they are not source-text greps.
import TargetsScreen from '@/app/onboarding/targets';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const render = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TargetsScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  useOnboardingStore.getState().reset();
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

// Every visible string, with the macro badges' grams replaced by a pattern so
// the check does not depend on the derived numbers.
const badge = (template: string) => new RegExp(template.replace('{{grams}}', '\\d+'));

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the title, buttons, badges and adjust sheet read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tg = locale.onboarding.targets;
  const tree = render();
  const text = allText(tree);

  expect(text).toContain(tg.title);
  expect(buttonWithTitle(tree, tg.accept)).toBeDefined();
  for (const template of [tg.protein, tg.carbs, tg.fat]) {
    expect(findAll(tree, (p) => typeof p.label === 'string' && badge(template).test(p.label))[0]).toBeDefined();
  }

  act(() => (buttonWithTitle(tree, tg.adjust)!.props.onPress as () => void)());
  const sheet = allText(tree);
  expect(sheet).toContain(tg.sheetTitle);
  expect(sheet).toContain(tg.sheetNote);
  expect(findAll(tree, (p) => p.label === tg.caloriesLabel)[0]).toBeDefined();
  expect(buttonWithTitle(tree, locale.common.save)).toBeDefined();

  if (lng !== 'en') {
    const english = en.onboarding.targets;
    for (const phrase of [english.title, english.sheetTitle, english.sheetNote]) {
      expect(sheet).not.toContain(phrase);
    }
    for (const title of [english.accept, english.adjust, en.common.save]) {
      expect(buttonWithTitle(tree, title)).toBeUndefined();
    }
    for (const template of [english.protein, english.carbs, english.fat]) {
      expect(findAll(tree, (p) => typeof p.label === 'string' && badge(template).test(p.label))).toHaveLength(0);
    }
    // "Calories" is the same word in French, so it only counts where it differs.
    if (english.caloriesLabel !== tg.caloriesLabel) {
      expect(findAll(tree, (p) => p.label === english.caloriesLabel)).toHaveLength(0);
    }
  }
});

test('the headline renders', () => {
  const tree = render();
  expect(allText(tree)).toContain('Your daily target');
});

test('accepting the target navigates to the next onboarding route', () => {
  const tree = render();
  const cont = buttonWithTitle(tree, "Looks right — let's go");
  act(() => (cont!.props.onPress as () => void)());

  expect(router.push).toHaveBeenCalledWith('/onboarding/paywall');
});
