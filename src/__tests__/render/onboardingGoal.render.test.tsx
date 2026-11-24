// Onboarding "Goal" step — single-select cards that auto-advance on tap.
// These EXECUTE the screen; they are not source-text greps.
import GoalScreen from '@/app/onboarding/goal';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { router } from 'expo-router';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

beforeEach(() => {
  useOnboardingStore.getState().reset();
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the headline and every goal card read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(<GoalScreen />);
  const { goalTitle, goalLose, goalMuscle, goalEatHealthier, goalTrack } = locale.onboarding;

  expect(allText(tree)).toContain(goalTitle);
  for (const label of [goalLose, goalMuscle, goalEatHealthier, goalTrack]) {
    expect(findAll(tree, (p) => p.accessibilityLabel === label)[0]).toBeDefined();
  }
  if (lng !== 'en') expect(allText(tree)).not.toContain(en.onboarding.goalTitle);
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

    expect(router.push).toHaveBeenCalledWith('/onboarding/activity');
  } finally {
    jest.useRealTimers();
  }
});
