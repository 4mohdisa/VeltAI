// PHASE3_ROWS.md row 14, WeekStrip (src/components/food/WeekStrip.tsx) spoken
// labels: the week arrows read weekStrip.previousWeek and weekStrip.nextWeek,
// and today's chip ends with gymCalendar.todaySuffix, in en, es and fr.
import { WeekStrip } from '@/components/food/WeekStrip';
import { isoDate } from '@/lib/data/foodDays';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, findAll, renderScreen } from './helpers';

const today = isoDate(new Date());

function renderStrip() {
  return renderScreen(<WeekStrip selected={today} onSelect={() => {}} loggedDays={new Set([today])} />);
}

type Tree = ReturnType<typeof renderStrip>;
const labels = (tree: Tree) =>
  findAll(tree, (p) => typeof p.accessibilityLabel === 'string').map((n) => n.props.accessibilityLabel as string);

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
] as const)('%s: week arrows and the today suffix come from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const all = labels(renderStrip());

  expect(all).toContain(locale.weekStrip.previousWeek);
  expect(all).toContain(locale.weekStrip.nextWeek);
  // findAll matches each Pressable at several wrapper levels; count distinct labels.
  expect(new Set(all.filter((l) => l.endsWith(locale.gymCalendar.todaySuffix))).size).toBe(1);
});

test('no English arrow label leaks into Spanish or French', async () => {
  for (const lng of ['es', 'fr']) {
    await act(async () => {
      await i18n.changeLanguage(lng);
    });
    const all = labels(renderStrip());
    expect(all).not.toContain('Previous week');
    expect(all).not.toContain('Next week');
    expect(all.some((l) => l.endsWith(', today'))).toBe(false);
  }
});
