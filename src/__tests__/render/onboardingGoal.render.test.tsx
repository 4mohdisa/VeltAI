// Onboarding "Goal" step — single-select cards that auto-advance on tap.
// These EXECUTE the screen; they are not source-text greps.
import GoalScreen from '@/app/onboarding/goal';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

beforeEach(() => {
  useOnboardingStore.getState().reset();
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

test('the headline renders', () => {
  const tree = renderScreen(<GoalScreen />);
  expect(allText(tree)).toContain("What's your main goal?");
});

test('picking a goal navigates to the next onboarding route', () => {
  jest.useFakeTimers();
  try {
    const tree = renderScreen(<GoalScreen />);
    const card = findAll(tree, (p) => p.accessibilityLabel === 'Lose weight')[0];

    act(() => {
      (card.props.onPress as () => void)();
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    const { router } = require('expo-router') as { router: { push: jest.Mock } };
    expect(router.push).toHaveBeenCalledWith('/onboarding/activity');
  } finally {
    jest.useRealTimers();
  }
});
