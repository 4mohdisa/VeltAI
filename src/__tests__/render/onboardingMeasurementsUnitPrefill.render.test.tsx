// Measurements step, coming back to the screen: the store keeps weight in kg,
// so a user who chose lb must see their weight in lb again, not the kg digits
// in an lb box (154 lb came back as "69.9" lb and was saved as 31.7 kg).
import MeasurementsScreen from '@/app/onboarding/measurements';
import { router } from 'expo-router';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, buttonWithTitle, findAll, renderScreen, screenTitle } from './helpers';

const m = en.onboarding.measurements;

const valueOf = (tree: ReturnType<typeof renderScreen>, label: string) =>
  findAll(tree, (p) => (p.accessibilityLabel === label || p.label === label) && typeof p.onChangeText === 'function')[0]
    .props.value;

beforeEach(() => {
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setGoal('lose');
});

test('lb: the saved kg weights come back in lb and Continue keeps the same kg', () => {
  // What typing 154 lb and a 132 lb target stores.
  useOnboardingStore.getState().setMeasurements({
    age: 30,
    sex: 'female',
    height_cm: 170,
    weight_kg: 69.9,
    target_weight_kg: 59.9,
    weight_unit: 'lb',
  });
  const tree = renderScreen(<MeasurementsScreen />);

  expect(screenTitle(tree)).toBe(m.title);
  expect(valueOf(tree, m.weightLbA11y)).toBe('154.1');
  expect(valueOf(tree, m.targetLabel.replace('{{unit}}', m.unitLb))).toBe('132.1');

  act(() => (buttonWithTitle(tree, m.continue)!.props.onPress as () => void)());
  expect(router.push).toHaveBeenCalledWith('/onboarding/body-type');
  expect(useOnboardingStore.getState().weight_kg).toBe(69.9);
  expect(useOnboardingStore.getState().target_weight_kg).toBe(59.9);
});

test('kg: the saved weights come back unchanged', () => {
  useOnboardingStore.getState().setMeasurements({ weight_kg: 70, target_weight_kg: 60, weight_unit: 'kg' });
  const tree = renderScreen(<MeasurementsScreen />);

  expect(valueOf(tree, m.weightKgA11y)).toBe('70');
  expect(valueOf(tree, m.targetLabel.replace('{{unit}}', m.unitKg))).toBe('60');
});
