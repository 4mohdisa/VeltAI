// PHASE3_ROWS.md row 15, Scan accuracy screen (src/app/profile/scan-calibration.tsx).
// Rendered in English, Spanish and French: the eyebrow and the title read from
// the locale file. The screen takes no route params, so the shared expo-router
// mock is enough.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ScanCalibrationScreen from '@/app/profile/scan-calibration';
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

// No network: the calibration read settles with nothing learned yet.
jest.mock('@/lib/api', () => ({
  api: { scan: { calibration: jest.fn().mockResolvedValue({ accuracy_summary: null, factors: [] }) } },
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
])('%s: the eyebrow and title read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ScanCalibrationScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  const text = allText(tree);
  expect(text).toContain(locale.settings.scanCalibrationEyebrow);
  expect(text).toContain(locale.settings.scanAccuracy);
  // Quoted: the serialised tree also holds props, so match the whole text node.
  if (lng !== 'en') {
    expect(text).not.toContain(JSON.stringify(en.settings.scanCalibrationEyebrow));
    expect(text).not.toContain(JSON.stringify(en.settings.scanAccuracy));
  }
});
