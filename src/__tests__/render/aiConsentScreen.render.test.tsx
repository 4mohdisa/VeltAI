// PHASE4_ROWS.md row 5b: the AI consent screen (src/app/ai-consent.tsx).
// Accept records the server consent through api.ai.setConsent and then the
// device flag; Decline records nothing and goes back. The api and the secure
// store are mocked; no network.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import AiConsentScreen from '@/app/ai-consent';
import { __resetAiConsentCache, AI_CONSENT_KEY } from '@/lib/ai/consent';
import { api } from '@/lib/api';
import en from '@/lib/i18n/locales/en.json';
import { setItem } from '@/lib/storage/secureStore';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/api', () => ({ api: { ai: { setConsent: jest.fn() } } }));

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

test('while saving, Accept shows loading and both buttons are disabled', async () => {
  setConsent.mockReturnValue(new Promise(() => {}));
  const tree = render();
  await press(tree, copy.accept);
  expect(buttonWithTitle(tree, copy.accept)?.props.loading).toBe(true);
  expect(buttonWithTitle(tree, copy.accept)?.props.disabled).toBe(true);
  expect(buttonWithTitle(tree, copy.decline)?.props.disabled).toBe(true);
});

test('accept records the server consent, then the device flag, and shows done', async () => {
  setConsent.mockResolvedValue({ consented: true });
  const tree = render();
  await press(tree, copy.accept);
  expect(setConsent).toHaveBeenCalledTimes(1);
  expect(setItem).toHaveBeenCalledWith(AI_CONSENT_KEY, '1');
  expect(allText(tree)).toContain(copy.done);

  await press(tree, en.common.done);
  expect(router.back).toHaveBeenCalledTimes(1);
});

test('a failed save shows the error, keeps the device flag unset, and Try again retries', async () => {
  setConsent.mockRejectedValueOnce(new Error('offline'));
  const tree = render();
  await press(tree, copy.accept);
  expect(allText(tree)).toContain(copy.error);
  expect(setItem).not.toHaveBeenCalled();

  setConsent.mockResolvedValueOnce({ consented: true });
  await press(tree, en.common.tryAgain);
  expect(setConsent).toHaveBeenCalledTimes(2);
  expect(setItem).toHaveBeenCalledWith(AI_CONSENT_KEY, '1');
  expect(allText(tree)).toContain(copy.done);
});

test('decline stores nothing and goes back', async () => {
  const tree = render();
  await press(tree, copy.decline);
  expect(setConsent).not.toHaveBeenCalled();
  expect(setItem).not.toHaveBeenCalled();
  expect(router.back).toHaveBeenCalledTimes(1);
});
