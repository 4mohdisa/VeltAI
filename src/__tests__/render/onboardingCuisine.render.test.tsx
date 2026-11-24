// Onboarding "Cuisine" step — multi-select tiles with a Continue button,
// disabled until at least one is picked. These EXECUTE the screen; they are
// not source-text greps.
import CuisineScreen from '@/app/onboarding/cuisine';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { router } from 'expo-router';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

beforeEach(() => {
  useOnboardingStore.getState().reset();
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
