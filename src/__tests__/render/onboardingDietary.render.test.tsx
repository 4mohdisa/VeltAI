// Onboarding "Dietary" step — multi-select pills with a Continue button.
// These EXECUTE the screen; they are not source-text greps.
import DietaryScreen from '@/app/onboarding/dietary';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { router } from 'expo-router';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

beforeEach(() => {
  useOnboardingStore.getState().reset();
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
