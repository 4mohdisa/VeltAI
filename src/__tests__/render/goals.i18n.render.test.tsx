// PHASE3_ROWS.md row 15, Goals screen (src/app/profile/goals.tsx) copy.
// Rendered in English, Spanish and French: the eyebrow, the title and the
// grams and percent field labels read from the locale file, and Spanish and
// French show none of the English literals the screen used to hard-code.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GoalsScreen from '@/app/profile/goals';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useSettingsStore } from '@/lib/settings/store';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const ENGLISH_LITERALS = [
  'Daily targets',
  'Protein (g)',
  'Carbs (g)',
  'Fat (g)',
  'Protein (%)',
  'Carbs (%)',
  'Fat (%)',
];

beforeEach(() => {
  useSettingsStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: false, status: 404, json: async () => ({ data: null, error: 'error' }) }),
  );
});

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: eyebrow, title and field labels read from the locale file', async (lang, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const copy = locale.goals;

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GoalsScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  const text = allText(tree);
  expect(text).toContain(copy.eyebrow);
  expect(text).toContain(copy.title);

  const labels = findAll(tree, (p) => typeof p.label === 'string').map((n) => n.props.label as string);
  for (const macro of [copy.protein, copy.carbs, copy.fat]) {
    expect(labels).toContain(copy.gramsField.replace('{{label}}', macro));
    expect(labels).toContain(copy.percentField.replace('{{label}}', macro));
  }

  if (lang !== 'en') {
    for (const english of ENGLISH_LITERALS) {
      expect(text).not.toContain(english);
      expect(labels).not.toContain(english);
    }
  }
});
