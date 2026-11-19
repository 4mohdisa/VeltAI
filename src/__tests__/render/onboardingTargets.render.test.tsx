// Onboarding "Targets" step — shows the derived plan with a CTA that accepts
// it as-is. These EXECUTE the screen; they are not source-text greps.
import TargetsScreen from '@/app/onboarding/targets';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

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

test('the headline renders', () => {
  const tree = render();
  expect(allText(tree)).toContain('Your daily target');
});

test('accepting the target navigates to the next onboarding route', () => {
  const tree = render();
  const cont = buttonWithTitle(tree, "Looks right — let's go");
  act(() => (cont!.props.onPress as () => void)());

  const { router } = require('expo-router') as { router: { push: jest.Mock } };
  expect(router.push).toHaveBeenCalledWith('/onboarding/paywall');
});
