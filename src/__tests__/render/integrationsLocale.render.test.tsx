// PHASE3_ROWS.md row 15, Connected apps screen (src/app/profile/integrations.tsx).
// Rendered in English, Spanish and French: the title reads profile.connectedApps
// from the locale file. The eyebrow is the live connection count, pinned in
// English by integrations.render.test.tsx, so it is not checked here. The
// screen takes no route params, so the shared expo-router mock is enough.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import IntegrationsScreen from '@/app/profile/integrations';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, renderScreen } from './helpers';

// The loading Skeletons need reanimated's useReducedMotion, which this render
// environment does not provide (see integrations.render.test.tsx).
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));

jest.mock('@/lib/api', () => ({
  api: {
    integrations: {
      list: jest.fn().mockResolvedValue([]),
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

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the title reads from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <IntegrationsScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  const text = allText(tree);
  expect(text).toContain(locale.profile.connectedApps);
  if (lng !== 'en') expect(text).not.toContain(en.profile.connectedApps);
});
