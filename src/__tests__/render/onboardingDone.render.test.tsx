// Onboarding "Done" step — a brief success beat, no CTA, that hands off to
// the main tabs on its own timer. These EXECUTE the screen; they are not
// source-text greps.
import DoneScreen from '@/app/onboarding/done';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { router } from 'expo-router';
import { act, allText, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

beforeEach(() => {
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

test('the headline renders', () => {
  const tree = renderScreen(<DoneScreen />);
  expect(allText(tree)).toContain("You're all set");
});

test('the hand-off timer replaces the stack with the main tabs', () => {
  jest.useFakeTimers();
  try {
    renderScreen(<DoneScreen />);
    act(() => {
      jest.advanceTimersByTime(750);
    });

    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  } finally {
    jest.useRealTimers();
  }
});
