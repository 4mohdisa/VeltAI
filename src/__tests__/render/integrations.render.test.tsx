// Connected apps screen (PHASE2_ROWS.md row 38 "Visual QA: sources") — no
// render test existed for src/app/profile/integrations.tsx before. This
// EXECUTES the real screen; it is not a source-text grep. api.integrations
// is mocked the same way quickAdd.render.test.tsx mocks @/lib/api — a
// jest.fn() per method the test controls, not the live module.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import IntegrationsScreen from '@/app/profile/integrations';
import type { IntegrationConnection } from '@/lib/types';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

// The loading state's two Skeletons animate through reanimated's
// useReducedMotion, which this render environment does not provide (same gap
// noted in dashboardSummary.render.test.tsx). Neither test here asserts on
// the loading state, so a plain stand-in is enough.
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

beforeEach(() => {
  mockList.mockClear();
});

test('renders the connected and not-connected providers from a successful list', async () => {
  const connections: IntegrationConnection[] = [
    { provider: 'strava', connected: true, last_sync_at: null },
    { provider: 'whoop', connected: false, last_sync_at: null },
  ];
  mockList.mockResolvedValue(connections);

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <IntegrationsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const text = allText(tree);
  expect(text).toContain('1 of 2 connected');
  expect(text).toContain('Strava');
  expect(text).toContain('WHOOP');
  expect(text).toContain('Connected');
  expect(buttonWithTitle(tree, 'Sync now')).toBeDefined();
  expect(buttonWithTitle(tree, 'Disconnect')).toBeDefined();
  expect(buttonWithTitle(tree, 'Connect WHOOP')).toBeDefined();
});

test('a failed list degrades every provider to Not connected', async () => {
  mockList.mockRejectedValue(new Error('network request failed'));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <IntegrationsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const text = allText(tree);
  expect(text).toContain('Nothing connected');
  expect(text).toContain('Import your runs, rides and swims as gym sessions.');
  expect(buttonWithTitle(tree, 'Connect Strava')).toBeDefined();
  expect(buttonWithTitle(tree, 'Connect WHOOP')).toBeDefined();
});
