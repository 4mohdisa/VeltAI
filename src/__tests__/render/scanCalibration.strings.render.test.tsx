// PHASE3_ROWS.md row 16, Scan accuracy screen (src/app/profile/scan-calibration.tsx).
// Rendered in Spanish and French: the learned-data body and the failed-load
// state read every visible string from the locale file, never the English.
// scanCalibrationLocale.render.test.tsx covers the eyebrow and title.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ScanCalibrationScreen from '@/app/profile/scan-calibration';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import type { ScanCalibration } from '@/lib/types';
import { act, allText, renderScreen } from './helpers';

// The loading Skeletons need reanimated's useReducedMotion, which this render
// environment does not provide (see integrations.render.test.tsx).
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));

const mockCalibration = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { scan: { calibration: (...args: unknown[]) => mockCalibration(...args) } },
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const DATA: ScanCalibration = {
  factors: [{ food_name: 'Rice', multiplier: 1.2, sample_count: 4 }],
  accuracy_summary: {
    total_scans: 10,
    corrected_count: 3,
    avg_correction_magnitude: 0.1,
    most_underestimated: ['Pasta'],
    most_overestimated: ['Salad'],
  },
};

const render = async (lng: string) => {
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
  return allText(tree);
};

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

const LOCALES = [
  ['es', es],
  ['fr', fr],
] as const;

test.each(LOCALES)('%s: the learned-data body reads from the locale file', async (lng, locale) => {
  mockCalibration.mockResolvedValue(DATA);
  const text = await render(lng);
  const s = locale.settings.scanCalibration;

  for (const value of [s.scoreTitle, s.learning, s.scansLogged, s.youCorrected, s.ofYourScans, s.learnedTitle, s.mostCorrected]) {
    expect(text).toContain(value);
  }
  expect(text).toContain(i18n.t('settings.scanCalibration.basedOn', { count: 4 }));
  expect(text).toContain(i18n.t('settings.scanCalibration.eatMore', { food: 'Pasta' }));
  expect(text).toContain(i18n.t('settings.scanCalibration.eatLess', { food: 'Salad' }));
  // Quoted: the serialised tree also holds props, so match the whole text node.
  expect(text).not.toContain(JSON.stringify(en.settings.scanCalibration.scoreTitle));
  expect(text).not.toContain(JSON.stringify(en.settings.scanCalibration.mostCorrected));
});

test.each(LOCALES)('%s: the failed-load state reads from the locale file', async (lng, locale) => {
  mockCalibration.mockRejectedValue(new Error('network request failed'));
  const text = await render(lng);

  expect(text).toContain(locale.settings.scanCalibration.loadFailed);
  expect(text).toContain(locale.errorState.retry);
  expect(text).not.toContain(JSON.stringify(en.settings.scanCalibration.loadFailed));
});
