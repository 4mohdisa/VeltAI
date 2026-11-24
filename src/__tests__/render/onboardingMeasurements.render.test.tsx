// Onboarding "A few more details" step in each app language. EXECUTES the
// screen: every label, option, accessibility label and the required-field
// messages read from the locale file, and es and fr show no English.
import MeasurementsScreen from '@/app/onboarding/measurements';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const has = (tree: ReturnType<typeof renderScreen>, prop: string, value: string) =>
  findAll(tree, (p) => p[prop] === value).length > 0;

beforeEach(() => {
  useOnboardingStore.getState().reset();
  // A weight-loss goal shows the target weight field too.
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
])('%s: labels, options and required messages read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const m = locale.onboarding.measurements;
  const tree = renderScreen(<MeasurementsScreen />);

  const text = allText(tree);
  expect(text).toContain(m.title);
  expect(text).toContain(m.subtitle);
  for (const label of [m.ageLabel, m.sexLabel, m.heightLabel, m.weightLabel, m.targetLabel.replace('{{unit}}', m.unitKg)]) {
    expect(has(tree, 'label', label)).toBe(true);
  }
  for (const option of [m.sexMale, m.sexFemale, m.sexOther]) {
    expect(has(tree, 'accessibilityLabel', option)).toBe(true);
  }
  expect(has(tree, 'accessibilityLabel', m.heightCmA11y)).toBe(true);
  expect(has(tree, 'accessibilityLabel', m.weightKgA11y)).toBe(true);
  expect(has(tree, 'placeholder', m.agePlaceholder)).toBe(true);

  const cont = buttonWithTitle(tree, m.continue);
  expect(cont).toBeDefined();
  act(() => (cont!.props.onPress as () => void)());
  const afterPress = allText(tree);
  for (const message of [m.ageRequired, m.sexRequired, m.heightRequired, m.weightRequired]) {
    expect(afterPress).toContain(message);
  }

  if (lng !== 'en') {
    const english = en.onboarding.measurements;
    for (const phrase of [english.title, english.subtitle, english.ageRequired, english.sexRequired]) {
      expect(afterPress).not.toContain(phrase);
    }
    for (const label of [english.ageLabel, english.sexLabel, english.heightLabel, english.weightLabel]) {
      expect(has(tree, 'label', label)).toBe(false);
    }
    expect(has(tree, 'accessibilityLabel', english.sexMale)).toBe(false);
  }
});
