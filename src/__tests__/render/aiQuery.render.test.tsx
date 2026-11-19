// Ask Lume — one-question-at-a-time AI query screen. Renders immediately, no
// consent gate on mount (consent is only checked on send). This EXECUTES the
// screen; it is not a source-text grep.
import AIQueryScreen from '@/app/ai-query';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { allText, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  ensureAiConsent: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/data/aiBrain', () => ({
  useAIQuery: jest.fn(() => ({ ask: jest.fn(() => Promise.resolve('')), loading: false, unavailable: false })),
}));

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
