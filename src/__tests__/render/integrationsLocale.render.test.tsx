// PHASE3_ROWS.md row 15, Connected apps screen (src/app/profile/integrations.tsx).
// Rendered in English, Spanish and French: the title reads profile.connectedApps
// and the live eyebrow (loading, nothing connected, count) reads the
// profile.connections* keys from the locale file. The screen takes no route
// params, so the shared expo-router mock is enough.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import IntegrationsScreen from '@/app/profile/integrations';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import type { IntegrationConnection } from '@/lib/types';
import { act, allText, renderScreen } from './helpers';

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

// The floating Screen reads the safe-area insets, which a test renderer never measures.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

const LOCALES = [
  ['en', en],
  ['es', es],
  ['fr', fr],
] as const;

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const render = async (lng: string) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <IntegrationsScreen />
    </SafeAreaProvider>,
  );
};

test.each(LOCALES)('%s: the title and the nothing-connected eyebrow read from the locale file', async (lng, locale) => {
  mockList.mockResolvedValue([]);
  const tree = await render(lng);
  await settle();

  const text = allText(tree);
  expect(text).toContain(locale.profile.connectedApps);
  expect(text).toContain(locale.profile.connectionsNone);
  if (lng !== 'en') {
    expect(text).not.toContain(en.profile.connectedApps);
    expect(text).not.toContain(en.profile.connectionsNone);
  }
});

test.each(LOCALES)('%s: the loading eyebrow reads from the locale file', async (lng, locale) => {
  mockList.mockReturnValue(new Promise(() => {}));
  const tree = await render(lng);

  expect(allText(tree)).toContain(locale.profile.connectionsSyncing);
});

test.each([
  ['en', '1 of 2 connected'],
  ['es', '1 de 2 conectados'],
  ['fr', '1 sur 2 connectés'],
])('%s: the count eyebrow fills in the count and total', async (lng, expected) => {
  const connections: IntegrationConnection[] = [
    { provider: 'strava', connected: true, last_sync_at: null },
    { provider: 'whoop', connected: false, last_sync_at: null },
  ];
  mockList.mockResolvedValue(connections);
  const tree = await render(lng);
  await settle();

  expect(allText(tree)).toContain(expected);
});
