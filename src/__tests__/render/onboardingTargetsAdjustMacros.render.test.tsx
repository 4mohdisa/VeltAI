// Row 14b Fix 9: Adjust on the onboarding Targets step recalculates protein,
// carbs and fat from the new calorie target, so the macros still add up to it.
import TargetsScreen from '@/app/onboarding/targets';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, buttonWithTitle, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const tg = en.onboarding.targets;

const grams = (tree: ReturnType<typeof renderScreen>, template: string): number => {
  const pattern = new RegExp(`^${template.replace('{{grams}}', '(\\d+)')}$`);
  const badge = findAll(tree, (p) => typeof p.label === 'string' && pattern.test(p.label))[0];
  return Number(pattern.exec(badge.props.label as string)![1]);
};

const macroKcal = (tree: ReturnType<typeof renderScreen>) =>
  grams(tree, tg.protein) * 4 + grams(tree, tg.carbs) * 4 + grams(tree, tg.fat) * 9;

beforeEach(() => {
  useOnboardingStore.getState().reset();
  useOnboardingStore.setState({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80, activity_level: 'moderate', goal: 'track' });
});

test('Adjust to a new calorie target recalculates the macros to within 2% of it', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TargetsScreen />
    </SafeAreaProvider>,
  );
  act(() => (buttonWithTitle(tree, tg.adjust)!.props.onPress as () => void)());
  const field = findAll(tree, (p) => p.label === tg.caloriesLabel && typeof p.onChangeText === 'function')[0];
  act(() => (field.props.onChangeText as (t: string) => void)('1800'));
  act(() => (buttonWithTitle(tree, en.common.save)!.props.onPress as () => void)());

  expect(useOnboardingStore.getState().calorie_target).toBe(1800);
  expect(Math.abs(macroKcal(tree) - 1800) / 1800).toBeLessThanOrEqual(0.02);
});
