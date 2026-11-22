// PHASE3_ROWS.md row 15, Scan accuracy body copy (src/app/profile/scan-calibration.tsx).
// Rendered in English, Spanish and French with a calibration that fills every
// section, then with none: each body string reads from settings.scanCalibration,
// and es and fr carry no English body text. The screen renders no StreakCounter.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ScanCalibrationScreen from '@/app/profile/scan-calibration';
import { api } from '@/lib/api';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, renderScreen } from './helpers';

// The loading Skeletons need reanimated's useReducedMotion, which this render
// environment does not provide (see scanCalibrationLocale.render.test.tsx).
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));

jest.mock('@/lib/api', () => ({ api: { scan: { calibration: jest.fn() } } }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const CALIBRATION = {
  accuracy_summary: {
    total_scans: 10,
    corrected_count: 4,
    avg_correction_magnitude: 0.2,
    most_underestimated: ['rice'],
    most_overestimated: ['pasta'],
  },
  factors: [{ food_name: 'oats', multiplier: 1.25, sample_count: 3 }],
};

const calibration = api.scan.calibration as jest.Mock;

async function render(lng: string, data: unknown): Promise<string> {
  calibration.mockResolvedValue(data);
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
}

const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k]));

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

test.each(LOCALES)('%s: the calibration body reads from the locale file', async (lng, locale) => {
  const c = locale.settings.scanCalibration;
  const text = await render(lng, CALIBRATION);

  for (const s of [
    c.scoreTitle,
    c.learning,
    c.scansLogged,
    c.youCorrected,
    c.ofYourScans,
    c.learnedTitle,
    c.mostCorrected,
    fill(c.percent, { value: 80 }),
    fill(c.percent, { value: 40 }),
    fill(c.adjustBy, { food: 'oats', adjustment: fill(c.percent, { value: '+25' }) }),
    fill(c.basedOn, { count: 3 }),
    fill(c.eatMore, { food: 'rice' }),
    fill(c.eatLess, { food: 'pasta' }),
  ]) {
    expect(text).toContain(s);
  }
  if (lng !== 'en') {
    const e = en.settings.scanCalibration;
    for (const s of [e.scoreTitle, e.learning, e.scansLogged, e.youCorrected, e.ofYourScans, e.learnedTitle, e.mostCorrected]) {
      // Quoted: the serialised tree also holds props, so match the whole text node.
      expect(text).not.toContain(JSON.stringify(s));
    }
    expect(text).not.toContain('We adjust by');
    expect(text).not.toContain('than we estimate');
    expect(text).not.toContain('Based on');
  }
});

test.each(LOCALES)('%s: the empty state reads from the locale file', async (lng, locale) => {
  const c = locale.settings.scanCalibration;
  const text = await render(lng, { accuracy_summary: null, factors: [] });

  expect(text).toContain(c.emptyTitle);
  expect(text).toContain(c.emptyMessage);
  if (lng !== 'en') {
    expect(text).not.toContain(en.settings.scanCalibration.emptyTitle);
    expect(text).not.toContain(en.settings.scanCalibration.emptyMessage);
  }
});
