// AI hub screen — gated behind one-time AI consent, then shows the brain
// profile, the Ask Lume entry, and the insights/anomalies feed (or an empty
// state). This EXECUTES the screen; it is not a source-text grep.
import { router } from 'expo-router';

import InsightsScreen from '@/app/insights';
import { hasAiConsent } from '@/lib/ai/consent';
import { useInsights } from '@/lib/data/aiBrain';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, allText, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/data/aiBrain', () => ({
  useInsights: jest.fn(() => ({ insights: [], anomalies: [], loading: false, isError: false, dismiss: jest.fn() })),
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

test('without consent, the consent screen replaces this one and no feed request is made', async () => {
  (hasAiConsent as jest.Mock).mockResolvedValueOnce(false);
  (useInsights as jest.Mock).mockClear();
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <InsightsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  expect(router.replace).toHaveBeenCalledWith('/ai-consent');
  expect(useInsights).not.toHaveBeenCalled();
  expect(allText(tree)).not.toContain('Lume is learning');
});
