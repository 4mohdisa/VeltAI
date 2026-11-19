// Onboarding "Body type" step — single-select cards that auto-advance on tap.
// These EXECUTE the screen; they are not source-text greps.
import BodyTypeScreen from '@/app/onboarding/body-type';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

beforeEach(() => {
  useOnboardingStore.getState().reset();
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

test('the headline renders', () => {
  const tree = renderScreen(<BodyTypeScreen />);
  expect(allText(tree)).toContain('What does your body look like right now?');
});

test('picking a body type navigates to the next onboarding route', () => {
  jest.useFakeTimers();
  try {
    const tree = renderScreen(<BodyTypeScreen />);
    const card = findAll(tree, (p) => p.accessibilityLabel === 'Skinny')[0];

    act(() => {
      (card.props.onPress as () => void)();
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    const { router } = require('expo-router') as { router: { push: jest.Mock } };
    expect(router.push).toHaveBeenCalledWith('/onboarding/targets');
  } finally {
    jest.useRealTimers();
  }
});
