// ConfidenceBadge with no server factors: opening "Why?" the way a user does
// shows scanCards.noBreakdown in the app language, instead of inventing a
// breakdown. scanConfidence.test.ts pins the source; this proves the render.
import { ConfidenceBadge } from '@/components/food/scan/ConfidenceBadge';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, findAll, renderScreen } from './helpers';

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the Why? panel says the scan returned no breakdown', async (lng, l) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(<ConfidenceBadge score={55} label="High" />);
  await act(async () => {});
  const hasMessage = () => findAll(tree, (p) => p.children === l.scanCards.noBreakdown).length > 0;
  expect(hasMessage()).toBe(false);

  const toggle = findAll(tree, (p) => p.accessibilityLabel === l.scanCards.whyLabel && typeof p.onPress === 'function')[0];
  act(() => {
    (toggle.props.onPress as () => void)();
  });

  expect(hasMessage()).toBe(true);
});
