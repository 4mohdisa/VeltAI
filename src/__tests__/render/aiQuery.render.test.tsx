// Ask Lume — one-question-at-a-time AI query screen. Renders immediately, no
// consent gate on mount (consent is only checked on send). This EXECUTES the
// screen; it is not a source-text grep.
import AIQueryScreen from '@/app/ai-query';
import { useAIQuery } from '@/lib/data/aiBrain';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  ensureAiConsent: jest.fn(() => Promise.resolve(true)),
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
