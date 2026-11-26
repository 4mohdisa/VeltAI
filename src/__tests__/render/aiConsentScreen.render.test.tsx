// PHASE4_ROWS.md row 5b: the AI consent screen (src/app/ai-consent.tsx).
// Allow records the server consent through api.ai.setConsent, then the device
// flag, then returns to the screen that asked (`from`, else back); Not now and
// Back record nothing and go back, or to the Food tab with no history; a failed
// save shows ErrorState with Try again. The api and the secure store are
// mocked; no network.
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import AiConsentScreen from '@/app/ai-consent';
import { __resetAiConsentCache, AI_CONSENT_KEY } from '@/lib/ai/consent';
import { api } from '@/lib/api';
import en from '@/lib/i18n/locales/en.json';
import { setItem } from '@/lib/storage/secureStore';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('@/lib/api', () => ({ api: { ai: { setConsent: jest.fn() } } }));

const mockCanGoBack = jest.fn(() => true);
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => mockCanGoBack() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@/lib/storage/secureStore', () => ({
  ...jest.requireActual('@/lib/storage/secureStore'),
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(true),
}));

const setConsent = api.ai.setConsent as jest.Mock;
const copy = en.aiConsent.screen;

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const render = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AiConsentScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  __resetAiConsentCache();
  setConsent.mockReset();
  (setItem as jest.Mock).mockClear();
  (router.back as jest.Mock).mockClear();
  (router.replace as jest.Mock).mockClear();
  mockCanGoBack.mockReturnValue(true);
  jest.mocked(useLocalSearchParams).mockReturnValue({});
});

type Tree = ReturnType<typeof renderScreen>;

const press = async (tree: Tree, title: string) => {
  await act(async () => {
    (buttonWithTitle(tree, title)?.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
};

test('shows what is sent, to whom, why and how to withdraw', () => {
  const text = allText(render());
  for (const line of [copy.what, copy.who, copy.why, copy.withdraw]) expect(text).toContain(line);
});

test('Allow and Not now carry equal weight', () => {
  const tree = render();
  expect(buttonWithTitle(tree, copy.accept)?.props.variant).toBe('secondary');
  expect(buttonWithTitle(tree, copy.decline)?.props.variant).toBe('secondary');
});

test('while saving, Allow shows loading and both buttons are disabled', async () => {
  setConsent.mockReturnValue(new Promise(() => {}));
  const tree = render();
  await press(tree, copy.accept);
  expect(buttonWithTitle(tree, copy.accept)?.props.loading).toBe(true);
  expect(buttonWithTitle(tree, copy.accept)?.props.disabled).toBe(true);
  expect(buttonWithTitle(tree, copy.decline)?.props.disabled).toBe(true);
});

test('Allow records the server consent, then the device flag, and goes back', async () => {
  setConsent.mockResolvedValue({ consented: true });
  const tree = render();
  await press(tree, copy.accept);
  expect(setConsent).toHaveBeenCalledTimes(1);
  expect(setItem).toHaveBeenCalledWith(AI_CONSENT_KEY, '1');
  expect(router.back).toHaveBeenCalledTimes(1);
});

test('a failed save shows ErrorState, keeps the device flag unset, and Try again saves and goes back', async () => {
  setConsent.mockRejectedValueOnce(new Error('offline'));
  const tree = render();
  await press(tree, copy.accept);
  expect(allText(tree)).toContain(copy.error);
  expect(setItem).not.toHaveBeenCalled();
  expect(router.back).not.toHaveBeenCalled();

  setConsent.mockResolvedValueOnce({ consented: true });
  await press(tree, en.common.tryAgain);
  expect(setConsent).toHaveBeenCalledTimes(2);
  expect(setItem).toHaveBeenCalledWith(AI_CONSENT_KEY, '1');
  expect(router.back).toHaveBeenCalledTimes(1);
});

test('Not now stores nothing and goes back', async () => {
  const tree = render();
  await press(tree, copy.decline);
  expect(setConsent).not.toHaveBeenCalled();
  expect(setItem).not.toHaveBeenCalled();
  expect(router.back).toHaveBeenCalledTimes(1);
});

describe('Fix 15a: consent returns to the screen that asked', () => {
  test('granted with an origin lands on that screen, not the one before it', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ from: '/insights' });
    setConsent.mockResolvedValue({ consented: true });
    const tree = render();
    await press(tree, copy.accept);
    expect(router.replace).toHaveBeenCalledWith('/insights');
    expect(router.back).not.toHaveBeenCalled();
  });

  test('granted with no origin and no history falls back to the Food tab', async () => {
    mockCanGoBack.mockReturnValue(false);
    setConsent.mockResolvedValue({ consented: true });
    const tree = render();
    await press(tree, copy.accept);
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/food');
    expect(router.back).not.toHaveBeenCalled();
  });

  test('declined with an origin goes back, so the asking screen cannot ask again', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ from: '/insights' });
    const tree = render();
    await press(tree, copy.decline);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('declined with no history falls back to the Food tab', async () => {
    mockCanGoBack.mockReturnValue(false);
    const tree = render();
    await press(tree, copy.decline);
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/food');
  });

  test('Back with no history falls back to the Food tab', async () => {
    mockCanGoBack.mockReturnValue(false);
    const tree = render();
    await act(async () => {
      (findAll(tree, (p) => p.accessibilityLabel === en.common.goBack && typeof p.onPress === 'function')[0].props
        .onPress as () => void)();
    });
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/food');
  });

  test('an origin that is not an app path is ignored', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ from: '//evil.example' });
    setConsent.mockResolvedValue({ consented: true });
    const tree = render();
    await press(tree, copy.accept);
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
