// Onboarding "Body type" step — single-select cards that auto-advance on tap.
// These EXECUTE the screen; they are not source-text greps.
import BodyTypeScreen from '@/app/onboarding/body-type';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { router } from 'expo-router';
import { act, allText, findAll, renderScreen, screenTitle } from './helpers';

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

const optionKeys = ['skinny', 'skinnyFat', 'average', 'overweight', 'muscular'] as const;

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the title, subtitle and every option read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const b = locale.onboarding.bodyType;
  const tree = renderScreen(<BodyTypeScreen />);
  const text = allText(tree);

  expect(text).toContain(b.title);
  expect(text).toContain(b.subtitle);
  for (const key of optionKeys) {
    expect(findAll(tree, (p) => p.accessibilityLabel === b[key])[0]).toBeDefined();
    expect(text).toContain(b[`${key}Desc`]);
  }
  if (lng !== 'en') {
    const english = en.onboarding.bodyType;
    expect(text).not.toContain(english.title);
    for (const key of optionKeys) {
      expect(findAll(tree, (p) => p.accessibilityLabel === english[key])).toHaveLength(0);
      expect(text).not.toContain(english[`${key}Desc`]);
    }
  }
});

test('the headline renders', () => {
  const tree = renderScreen(<BodyTypeScreen />);
  expect(screenTitle(tree)).toBe('What does your body look like right now?');
});

test('every card gives screen readers its description as the hint', () => {
  const b = en.onboarding.bodyType;
  const tree = renderScreen(<BodyTypeScreen />);
  for (const key of optionKeys) {
    const card = findAll(tree, (p) => p.accessibilityLabel === b[key] && typeof p.onPress === 'function')[0];
    expect(card.props.accessibilityHint).toBe(b[`${key}Desc`]);
  }
});

test('with Reduce Motion, picking saves the choice and continues at once', () => {
  (useReduceMotion as jest.Mock).mockReturnValue(true);
  const tree = renderScreen(<BodyTypeScreen />);
  const card = findAll(tree, (p) => p.accessibilityLabel === en.onboarding.bodyType.average)[0];
  act(() => (card.props.onPress as () => void)());

  expect(useOnboardingStore.getState().body_type).toBe('average');
  expect(router.push).toHaveBeenCalledWith('/onboarding/targets');
});

test('Back returns to the previous step', () => {
  const tree = renderScreen(<BodyTypeScreen />);
  const back = findAll(tree, (p) => p.accessibilityLabel === en.common.goBack && typeof p.onPress === 'function')[0];
  act(() => (back.props.onPress as () => void)());

  expect(router.back).toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
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

    expect(router.push).toHaveBeenCalledWith('/onboarding/targets');
  } finally {
    jest.useRealTimers();
  }
});
