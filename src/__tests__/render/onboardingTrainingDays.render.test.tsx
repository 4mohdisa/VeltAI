// Onboarding "Training days" step — single-select cards with a default, then Continue.
import TrainingDaysScreen from '@/app/onboarding/training-days';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { router } from 'expo-router';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const card = (tree: ReturnType<typeof renderScreen>, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label)[0];

beforeEach(() => {
  useOnboardingStore.getState().reset();
});

test('the headline renders and 3 to 4 days is selected by default', () => {
  const tree = renderScreen(<TrainingDaysScreen />);
  expect(allText(tree)).toContain('How many days a week do you train?');
  expect(card(tree, '3 to 4 days').props.accessibilityState).toEqual({ selected: true });
  expect(card(tree, '0 days').props.accessibilityState).toEqual({ selected: false });
});

test('tapping an option selects it', () => {
  const tree = renderScreen(<TrainingDaysScreen />);
  act(() => (card(tree, '5 or more days').props.onPress as () => void)());

  expect(card(tree, '5 or more days').props.accessibilityState).toEqual({ selected: true });
  expect(card(tree, '3 to 4 days').props.accessibilityState).toEqual({ selected: false });
});

test('Continue is enabled after a selection', () => {
  const tree = renderScreen(<TrainingDaysScreen />);
  act(() => (card(tree, '1 to 2 days').props.onPress as () => void)());

  expect(buttonWithTitle(tree, 'Continue')!.props.disabled).toBeFalsy();
});

test('Continue keeps the chosen value and moves to the next step', () => {
  const tree = renderScreen(<TrainingDaysScreen />);
  act(() => (card(tree, '0 days').props.onPress as () => void)());
  act(() => (buttonWithTitle(tree, 'Continue')!.props.onPress as () => void)());

  expect(useOnboardingStore.getState().training_days).toBe('days_0');
  expect(router.push).toHaveBeenCalledWith('/onboarding/cuisine');
});
