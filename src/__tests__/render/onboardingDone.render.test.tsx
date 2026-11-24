// Onboarding "Done" step — a brief success beat after the paywall's successful
// onboarding POST, no CTA, that hands off to the main tabs on its own timer.
// These EXECUTE the screen; they are not source-text greps.
import DoneScreen from '@/app/onboarding/done';
import { showToast } from '@/components/display/toastStore';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { router } from 'expo-router';
import { act, allText, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));
jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));

beforeEach(() => {
  (useReduceMotion as jest.Mock).mockReturnValue(false);
  (showToast as jest.Mock).mockClear();
  jest.useFakeTimers();
});

afterEach(async () => {
  jest.useRealTimers();
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the headline and the welcome toast read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const d = locale.onboarding.done;
  const tree = renderScreen(<DoneScreen />);
  const text = allText(tree);
  act(() => {
    jest.advanceTimersByTime(750);
  });

  expect(text).toContain(d.title);
  expect(showToast).toHaveBeenCalledWith({ message: d.welcomeToast, tone: 'success' });
  if (lng !== 'en') {
    expect(text).not.toContain(en.onboarding.done.title);
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ message: en.onboarding.done.welcomeToast }));
  }
});

test('the headline renders', () => {
  const tree = renderScreen(<DoneScreen />);
  expect(allText(tree)).toContain("You're all set");
});

test('the hand-off timer replaces the stack with the main tabs', () => {
  renderScreen(<DoneScreen />);
  expect(router.replace).not.toHaveBeenCalledWith('/(tabs)');
  act(() => {
    jest.advanceTimersByTime(750);
  });

  expect(router.replace).toHaveBeenCalledWith('/(tabs)');
});
