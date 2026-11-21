// AI hub screen — gated behind one-time AI consent, then shows the brain
// profile, the Ask Lume entry, and the insights/anomalies feed (or an empty
// state). This EXECUTES the screen; it is not a source-text grep.
import InsightsScreen from '@/app/insights';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, allText, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  ensureAiConsent: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/data/aiBrain', () => ({
  useInsights: jest.fn(() => ({ insights: [], anomalies: [], loading: false, dismiss: jest.fn() })),
  useBrainProfile: jest.fn(() => ({ profile: null, loading: false, notEnoughData: true })),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

test('renders the learning empty state once AI consent is granted', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <InsightsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const text = allText(tree);
  expect(text).toContain('Lume is learning');
  expect(text).toContain('Log food and workouts for a few days and your personalised insights will appear here.');
});
