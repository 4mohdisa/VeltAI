// Row 2b dead end 8: target weight follows the current weight rule on the
// measurements step: required when shown, 30 to 300 kg (66 to 661 lb), the
// same inline error, and an invalid value blocks Continue. EXECUTES the screen.
import MeasurementsScreen from '@/app/onboarding/measurements';
import { router } from 'expo-router';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const m = en.onboarding.measurements;
const KG_RANGE = m.weightRangeKg.replace('{{min}}', '30').replace('{{max}}', '300');
const targetLabel = m.targetLabel.replace('{{unit}}', m.unitKg);

// Every other field is valid, so only the target weight decides Continue.
beforeEach(() => {
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setGoal('lose');
  useOnboardingStore.getState().setMeasurements({ age: 30, sex: 'female', height_cm: 170, weight_kg: 80 });
});

function render() {
  const tree = renderScreen(<MeasurementsScreen />);
  const typeTarget = (text: string) =>
    act(() => (findAll(tree, (p) => p.label === targetLabel)[0].props.onChangeText as (t: string) => void)(text));
  const pressContinue = () => act(() => (buttonWithTitle(tree, m.continue)!.props.onPress as () => void)());
  return { tree, typeTarget, pressContinue };
}

test('a valid target weight continues to the body type step', () => {
  const { tree, typeTarget, pressContinue } = render();
  typeTarget('70');
  pressContinue();

  expect(allText(tree)).not.toContain(KG_RANGE);
  expect(router.push).toHaveBeenCalledWith('/onboarding/body-type');
  expect(useOnboardingStore.getState().target_weight_kg).toBe(70);
});

test.each(['29', '301', 'abc'])('an out-of-range target weight (%s) shows the weight range error and blocks Continue', (value) => {
  const { tree, typeTarget, pressContinue } = render();
  typeTarget(value);
  expect(allText(tree)).toContain(KG_RANGE);

  pressContinue();
  expect(router.push).not.toHaveBeenCalled();
});

test('an empty target weight is quiet until Continue, then required like the weight field', () => {
  const { tree, pressContinue } = render();
  expect(allText(tree)).not.toContain(m.targetRequired);

  pressContinue();
  expect(allText(tree)).toContain(m.targetRequired);
  expect(router.push).not.toHaveBeenCalled();
});

test('with a goal that hides the target field, no target is needed to continue', () => {
  useOnboardingStore.getState().setGoal('track');
  const { tree, pressContinue } = render();
  expect(findAll(tree, (p) => p.label === targetLabel)).toHaveLength(0);

  pressContinue();
  expect(router.push).toHaveBeenCalledWith('/onboarding/body-type');
});
