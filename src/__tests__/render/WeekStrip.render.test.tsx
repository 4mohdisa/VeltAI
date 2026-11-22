// PHASE3_ROWS.md row 13, WeekStrip (src/components/food/WeekStrip.tsx) strings.
// The seven day letters come from calendar.weekdayLetters, the month control
// from food.pickDayLabel and a logged day from calendar.dayLogged, all read from
// the locale files in English and then in Spanish.
import { WeekStrip } from '@/components/food/WeekStrip';
import { fromIso, isoDate } from '@/lib/data/foodDays';
import { formatMonthYear, formatWeekdayDate } from '@/lib/formatting';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

const today = isoDate(new Date());

function renderStrip() {
  return renderScreen(
    <WeekStrip selected={today} onSelect={() => {}} loggedDays={new Set([today])} onOpenCalendar={() => {}} />,
  );
}

type Tree = ReturnType<typeof renderStrip>;
const letters = (tree: Tree) =>
  tree.root
    .findAll((n) => typeof n.type === 'string' && typeof n.props.children === 'string' && n.props.children.length === 1)
    .map((n) => n.props.children as string);
const hasLabel = (tree: Tree, label: string) => findAll(tree, (p) => p.accessibilityLabel === label).length > 0;
const dayLogged = (template: string) => template.replace('{{date}}', formatWeekdayDate(fromIso(today)));

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: day letters and labels come from en.json', () => {
  const tree = renderStrip();
  expect(letters(tree).join('')).toBe(en.calendar.weekdayLetters);
  expect(hasLabel(tree, en.food.pickDayLabel.replace('{{date}}', formatMonthYear(fromIso(today))))).toBe(true);
  expect(findAll(tree, (p) => typeof p.accessibilityLabel === 'string' && (p.accessibilityLabel as string).startsWith(dayLogged(en.calendar.dayLogged))).length).toBeGreaterThan(0);
});

test('Spanish: day letters switch to es.json', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = renderStrip();
  expect(letters(tree).join('')).toBe(es.calendar.weekdayLetters);
  expect(hasLabel(tree, es.food.pickDayLabel.replace('{{date}}', formatMonthYear(fromIso(today))))).toBe(true);
});
