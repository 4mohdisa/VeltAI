// Onboarding "Activity" step — single-select cards that auto-advance on tap.
// These EXECUTE the screen; they are not source-text greps.
import ActivityScreen from '@/app/onboarding/activity';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { router } from 'expo-router';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

beforeEach(() => {
  useOnboardingStore.getState().reset();
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

test('the headline renders', () => {
  const tree = renderScreen(<ActivityScreen />);
  expect(allText(tree)).toContain('How active are you?');
});

test('picking an activity level navigates to the next onboarding route', () => {
  jest.useFakeTimers();
  try {
    const tree = renderScreen(<ActivityScreen />);
    const card = findAll(tree, (p) => p.accessibilityLabel === 'Mostly sitting (office work)')[0];

    act(() => {
      (card.props.onPress as () => void)();
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(router.push).toHaveBeenCalledWith('/onboarding/cuisine');
  } finally {
    jest.useRealTimers();
  }
});
