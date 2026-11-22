// PHASE3_ROWS.md row 16, Connected apps screen (src/app/profile/integrations.tsx).
// A failed list shows a LoadFailedNotice with Retry above the not-connected
// rows; a successful Retry clears it. Never shown on a successful load.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import IntegrationsScreen from '@/app/profile/integrations';
import { act, allText, findAll, renderScreen } from './helpers';

// The loading Skeletons need reanimated's useReducedMotion, which this render
// environment does not provide (see integrations.render.test.tsx).
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));

const mockList = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    integrations: {
      list: (...args: unknown[]) => mockList(...args),
      connectStrava: jest.fn(),
      connectWhoop: jest.fn(),
      syncStrava: jest.fn(),
      syncWhoop: jest.fn(),
      disconnect: jest.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
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

const render = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <IntegrationsScreen />
    </SafeAreaProvider>,
  );

const FAILED = "Couldn't load your connected apps.";

beforeEach(() => {
  mockList.mockReset();
});

test('a failed list shows the load-failed notice, and Retry clears it', async () => {
  mockList.mockRejectedValueOnce(new Error('network request failed')).mockResolvedValueOnce([
    { provider: 'strava', connected: true, last_sync_at: null },
  ]);
  const tree = render();
  await settle();

  expect(allText(tree)).toContain(FAILED);
  const retry = findAll(tree, (p) => p.accessibilityLabel === 'Try again' && typeof p.onPress === 'function')[0];
  expect(retry).toBeDefined();

  await act(async () => {
    (retry.props.onPress as () => void)();
  });
  await settle();

  expect(mockList).toHaveBeenCalledTimes(2);
  expect(allText(tree)).not.toContain(FAILED);
  expect(allText(tree)).toContain('Connected');
});

test('a successful list shows no load-failed notice', async () => {
  mockList.mockResolvedValue([]);
  const tree = render();
  await settle();

  expect(allText(tree)).not.toContain(FAILED);
});
