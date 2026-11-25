// Onboarding "Activity" step — single-select cards that auto-advance on tap.
// These EXECUTE the screen; they are not source-text greps.
import ActivityScreen from '@/app/onboarding/activity';
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
])('%s: the headline and every activity card read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(<ActivityScreen />);
  const { activityTitle, activitySedentary, activityLight, activityModerate, activityVeryActive } = locale.onboarding;

  expect(allText(tree)).toContain(activityTitle);
  for (const label of [activitySedentary, activityLight, activityModerate, activityVeryActive]) {
    expect(findAll(tree, (p) => p.accessibilityLabel === label)[0]).toBeDefined();
  }
  if (lng !== 'en') expect(allText(tree)).not.toContain(en.onboarding.activityTitle);
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

    expect(router.push).toHaveBeenCalledWith('/onboarding/training-days');
  } finally {
    jest.useRealTimers();
  }
});
