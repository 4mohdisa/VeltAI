// Onboarding Targets, Adjust sheet: a calorie target outside the safe band
// (or an empty one) is refused with the range under the field and the sheet
// stays open, instead of being silently replaced by the floor. Typing clears
// the message; an in-range value saves.
import TargetsScreen from '@/app/onboarding/targets';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, allText, buttonWithTitle, findAll, renderScreen, screenTitle } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const tg = en.onboarding.targets;
// Unspecified sex takes the higher 1,500 kcal floor.
const rangeMessage = 'Enter a target between 1,500 and 10,000 kcal';

function openSheet() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TargetsScreen />
    </SafeAreaProvider>,
  );
  act(() => (buttonWithTitle(tree, tg.adjust)!.props.onPress as () => void)());
  return tree;
}

const field = (tree: ReturnType<typeof renderScreen>) =>
  findAll(tree, (p) => p.label === tg.caloriesLabel && typeof p.onChangeText === 'function')[0];

function type(tree: ReturnType<typeof renderScreen>, text: string) {
  act(() => (field(tree).props.onChangeText as (t: string) => void)(text));
}

const save = (tree: ReturnType<typeof renderScreen>) =>
  act(() => (buttonWithTitle(tree, en.common.save)!.props.onPress as () => void)());

beforeEach(() => {
  useOnboardingStore.getState().reset();
  useOnboardingStore.setState({ age: 30, height_cm: 175, weight_kg: 75 });
});

test('a value below the floor shows the range and is not saved', () => {
  const tree = openSheet();
  const title = screenTitle(tree);
  type(tree, '800');
  save(tree);

  expect(allText(tree)).toContain(rangeMessage);
  expect(allText(tree)).toContain(tg.sheetTitle);
  expect(useOnboardingStore.getState().calorie_target).not.toBe(800);
  expect(useOnboardingStore.getState().calorie_target).not.toBe(1500);
  expect(screenTitle(tree)).toBe(title);
});

test('an empty value shows the range', () => {
  const tree = openSheet();
  type(tree, '');
  save(tree);
  expect(allText(tree)).toContain(rangeMessage);
});

test('typing clears the message and an in-range value saves', () => {
  const tree = openSheet();
  type(tree, '800');
  save(tree);
  type(tree, '2100');
  expect(allText(tree)).not.toContain(rangeMessage);

  save(tree);
  expect(useOnboardingStore.getState().calorie_target).toBe(2100);
  expect(allText(tree)).toContain('2,100');
});
