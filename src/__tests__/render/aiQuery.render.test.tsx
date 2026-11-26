// Ask Lume — one-question-at-a-time AI query screen. Renders immediately, no
// consent gate on mount (consent is only checked on send). This EXECUTES the
// screen; it is not a source-text grep.
import { router } from 'expo-router';

import AIQueryScreen from '@/app/ai-query';
import { hasAiConsent } from '@/lib/ai/consent';
import { useAIQuery } from '@/lib/data/aiBrain';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/data/aiBrain', () => ({
  useAIQuery: jest.fn(() => ({ ask: jest.fn(() => Promise.resolve('')), loading: false, unavailable: false })),
}));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

test('renders the empty prompt before any question is asked', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AIQueryScreen />
    </SafeAreaProvider>,
  );

  expect(allText(tree)).toContain('Ask a question about your nutrition data');
});

test('pressing Send shows the answer once ask resolves', async () => {
  (useAIQuery as jest.Mock).mockReturnValue({
    ask: jest.fn(() => Promise.resolve('Your protein is on track this week.')),
    loading: false,
    unavailable: false,
  });

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AIQueryScreen />
    </SafeAreaProvider>,
  );

  const input = findAll(tree, (p) => p.accessibilityLabel === 'Ask a question')[0];
  act(() => (input.props.onChangeText as (t: string) => void)("How's my protein this week?"));

  const send = findAll(tree, (p) => p.accessibilityLabel === 'Send')[0];
  act(() => (send.props.onPress as () => void)());
  await settle();

  expect(allText(tree)).toContain('Your protein is on track this week.');
});

test('without consent, Send opens the consent screen, sends nothing and keeps the question', async () => {
  const ask = jest.fn(() => Promise.resolve(''));
  (useAIQuery as jest.Mock).mockReturnValue({ ask, loading: false, unavailable: false });
  (hasAiConsent as jest.Mock).mockResolvedValueOnce(false);

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AIQueryScreen />
    </SafeAreaProvider>,
  );

  const input = findAll(tree, (p) => p.accessibilityLabel === 'Ask a question')[0];
  act(() => (input.props.onChangeText as (t: string) => void)("How's my protein this week?"));

  const send = findAll(tree, (p) => p.accessibilityLabel === 'Send')[0];
  act(() => (send.props.onPress as () => void)());
  await settle();

  expect(router.push).toHaveBeenCalledWith('/ai-consent');
  expect(ask).not.toHaveBeenCalled();
  expect(findAll(tree, (p) => p.accessibilityLabel === 'Ask a question')[0].props.value).toBe("How's my protein this week?");
});

describe('Fix 15b: Back always has somewhere to go', () => {
  const pressBack = () => {
    const tree = renderScreen(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AIQueryScreen />
      </SafeAreaProvider>,
    );
    act(() => (findAll(tree, (p) => p.accessibilityLabel === 'Back')[0].props.onPress as () => void)());
  };

  afterEach(() => jest.restoreAllMocks());

  test('with history, Back goes back', () => {
    jest.spyOn(router, 'canGoBack').mockReturnValue(true);
    pressBack();
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('with no history, Back lands on the Food tab', () => {
    jest.spyOn(router, 'canGoBack').mockReturnValue(false);
    pressBack();
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/food');
    expect(router.back).not.toHaveBeenCalled();
  });
});
