// PHASE3_ROWS.md row 15, AnomalyBanner (src/components/ai/AnomalyBanner.tsx) error state.
// Rendered in Spanish and French with a failed insights read: the shared
// ErrorState copy reads from the locale file and none of the banner's English
// (anomaly title, count title, dismiss label, error copy) is shown.
import type { AIAnomaly } from '@/lib/api';
import { AnomalyBanner } from '@/components/ai/AnomalyBanner';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

const untitled = (id: string): AIAnomaly => ({ id, dismissed: false, created_at: '2026-01-01T00:00:00.000Z' });

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['es', es],
  ['fr', fr],
])('%s: the error state reads from the locale file and shows no English', async (lang, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });

  const tree = renderScreen(
    <AnomalyBanner anomalies={[untitled('a1'), untitled('a2')]} isError onPress={jest.fn()} onDismiss={jest.fn()} />,
  );
  const text = allText(tree);

  expect(text).toContain(locale.errorState.title);
  expect(text).toContain(locale.errorState.message);
  for (const english of [
    en.errorState.title,
    en.errorState.message,
    en.errorState.retry,
    en.insights.anomaly.fallbackTitle,
    en.insights.anomaly.bannerCount_other.replace('{{count}}', '2'),
  ]) {
    expect(text).not.toContain(english);
  }
  expect(findAll(tree, (p) => p.accessibilityLabel === en.insights.anomaly.dismiss)).toHaveLength(0);
});
