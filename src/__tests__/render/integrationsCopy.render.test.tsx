// PHASE3_ROWS.md row 15, Connected apps body copy (src/app/profile/integrations.tsx).
// Rendered in English, Spanish and French with mocked connections: the intro,
// provider blurbs, connected status, relative sync time, button titles and the
// sync toast read from profile.integrations.*, and es and fr carry no English
// body string. The screen renders no StreakCounter.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import IntegrationsScreen from '@/app/profile/integrations';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import type { IntegrationConnection } from '@/lib/types';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

// The loading Skeletons need reanimated's useReducedMotion, which this render
// environment does not provide (see integrations.render.test.tsx).
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));

const mockToast = jest.fn();
jest.mock('@/components/display/toastStore', () => ({
  showToast: (...args: unknown[]) => mockToast(...args),
}));

const mockList = jest.fn();
const mockSyncStrava = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    integrations: {
      list: (...args: unknown[]) => mockList(...args),
      connectStrava: jest.fn(),
      connectWhoop: jest.fn(),
      syncStrava: (...args: unknown[]) => mockSyncStrava(...args),
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

const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k]));

async function render(lng: string, connections: IntegrationConnection[]) {
  mockList.mockResolvedValue(connections);
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <IntegrationsScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

beforeEach(() => {
  mockToast.mockClear();
  mockSyncStrava.mockResolvedValue({ imported: 3, skipped: 1 });
});

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

const E = en.profile.integrations;

test.each(LOCALES)('%s: the connected body copy and sync toast read from the locale file', async (lng, locale) => {
  const c = locale.profile.integrations;
  const tree = await render(lng, [
    { provider: 'strava', connected: true, last_sync_at: TWO_HOURS_AGO },
    { provider: 'whoop', connected: false, last_sync_at: null },
  ]);

  const text = allText(tree);
  expect(text).toContain(c.intro);
  expect(text).toContain(fill(c.connectedSynced, { time: fill(c.hoursAgo, { count: 2 }) }));
  expect(text).toContain(c.whoopBlurb);
  expect(buttonWithTitle(tree, c.syncNow)).toBeDefined();
  expect(buttonWithTitle(tree, c.disconnect)).toBeDefined();
  expect(buttonWithTitle(tree, fill(c.connect, { name: 'WHOOP' }))).toBeDefined();

  await act(async () => {
    buttonWithTitle(tree, c.syncNow)!.props.onPress();
  });
  await settle();
  expect(mockToast).toHaveBeenCalledWith(
    expect.objectContaining({ message: fill(c.syncDone, { name: 'Strava', imported: 3, skipped: 1 }) }),
  );

  if (lng !== 'en') {
    for (const s of [E.intro, E.whoopBlurb, 'synced', 'h ago', 'Sync now', 'Disconnect', 'Connect WHOOP']) {
      expect(text).not.toContain(s);
    }
    expect(mockToast.mock.calls[0][0].message).not.toContain('imported');
  }
});

test.each(LOCALES)('%s: the not-connected body copy reads from the locale file', async (lng, locale) => {
  const c = locale.profile.integrations;
  const tree = await render(lng, []);

  const text = allText(tree);
  expect(text).toContain(c.stravaBlurb);
  expect(text).toContain(c.whoopBlurb);
  expect(buttonWithTitle(tree, fill(c.connect, { name: 'Strava' }))).toBeDefined();
  if (lng !== 'en') {
    for (const s of [E.stravaBlurb, E.whoopBlurb, 'Connect Strava', 'Connect WHOOP']) {
      expect(text).not.toContain(s);
    }
  }
});
