// Fix 16 (DESIGN_INTENT.md): the Insights feed through the REAL useInsights
// hook, with @/lib/api mocked at the module boundary. Loading shows skeletons; a
// failed read shows the shared ErrorState, whose Retry reads again; an empty
// read shows "no insights"; a read with items shows them. No network.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import InsightsScreen from '@/app/insights';
import { Skeleton } from '@/components/display';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn(() => Promise.resolve(true)),
}));

// Skeleton animates through reanimated's useReducedMotion, which this render
// environment does not provide (see gymStreakStripFootnote.render.test.tsx). A
// plain stand-in still lets the loading test find the placeholders by type.
jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

const mockGetInsights = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    ai: {
      getInsights: (...args: unknown[]) => mockGetInsights(...args),
      getAnomalies: () => Promise.resolve([]),
      // A learned profile, so an empty feed reads "no insights", not "learning".
      getProfile: () => Promise.resolve({ not_enough_data: false }),
    },
  },
}));

const INSIGHT = {
  id: 'i1',
  type: null,
  title: 'Protein is up',
  body: 'You hit your protein goal four days running.',
  data: null,
  shown_at: null,
  dismissed: false,
  created_at: '2026-11-01T00:00:00Z',
};

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const render = async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <InsightsScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
};

beforeEach(() => mockGetInsights.mockReset());

test('while the feed loads it shows skeletons, not an empty or error state', async () => {
  mockGetInsights.mockReturnValue(new Promise(() => {}));
  const tree = await render();
  expect(tree.root.findAllByType(Skeleton).length).toBeGreaterThan(0);
  const text = allText(tree);
  expect(text).not.toContain(en.insights.emptyTitle);
  expect(text).not.toContain(en.errorState.title);
});

test('a failed read shows the error state, not "no insights", and Retry reads again', async () => {
  mockGetInsights.mockRejectedValueOnce(new TypeError('Network request failed'));
  const tree = await render();
  expect(allText(tree)).toContain(en.errorState.title);
  expect(allText(tree)).not.toContain(en.insights.emptyTitle);

  mockGetInsights.mockResolvedValueOnce([INSIGHT]);
  await act(async () => {
    (buttonWithTitle(tree, en.errorState.retry)!.props.onPress as () => void)();
  });
  await settle();

  expect(mockGetInsights).toHaveBeenCalledTimes(2);
  const text = allText(tree);
  expect(text).not.toContain(en.errorState.title);
  expect(text).toContain('Protein is up');
});

test('a read with no items shows "no insights"', async () => {
  mockGetInsights.mockResolvedValueOnce([]);
  const tree = await render();
  const text = allText(tree);
  expect(text).toContain(en.insights.emptyTitle);
  expect(text).not.toContain(en.errorState.title);
});

test('a read with items shows them', async () => {
  mockGetInsights.mockResolvedValueOnce([INSIGHT]);
  const tree = await render();
  const text = allText(tree);
  expect(text).toContain('Protein is up');
  expect(text).not.toContain(en.insights.emptyTitle);
});
