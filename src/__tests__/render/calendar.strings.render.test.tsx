// PHASE3_ROWS.md row 13, Pick a day sheet (src/app/food/calendar.tsx) strings.
// The title, subtitle, weekday letters, Jump to today and the month arrows are
// read from the calendar block of en.json, then the same sheet is checked in
// Spanish. useLoggedDays is stubbed so today carries the logged-day label.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FoodCalendarScreen from '@/app/food/calendar';
import { fromIso, isoDate } from '@/lib/data/foodDays';
import { formatWeekdayDate } from '@/lib/formatting';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useFocusEffect: (cb: () => void) => jest.requireActual('react').useEffect(cb, [cb]),
}));

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

jest.mock('@/lib/data/foodDays', () => {
  const actual = jest.requireActual('@/lib/data/foodDays');
  const today = actual.isoDate(new Date());
  return { ...actual, useLoggedDays: () => ({ days: new Set([today]) }) };
});

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

function renderCalendar() {
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodCalendarScreen />
    </SafeAreaProvider>,
  );
}

type Tree = ReturnType<typeof renderCalendar>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const hasLabel = (tree: Tree, label: string) => findAll(tree, (p) => p.accessibilityLabel === label).length > 0;

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: the sheet strings come from the calendar block of en.json', () => {
  const tree = renderCalendar();
  expect(hasText(tree, en.calendar.title)).toBe(true);
  expect(hasText(tree, en.calendar.subtitle)).toBe(true);
  expect(hasText(tree, en.calendar.jumpToToday)).toBe(true);
  expect(hasLabel(tree, en.calendar.previousMonth)).toBe(true);
  expect(findAll(tree, (p) => p.children === en.calendar.weekdayLetters[0]).length).toBeGreaterThan(0);
  const todayLabel = en.calendar.dayLogged.replace('{{date}}', formatWeekdayDate(fromIso(isoDate(new Date()))));
  expect(hasLabel(tree, todayLabel)).toBe(true);
});

test('Spanish: the same sheet switches to es.json', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = renderCalendar();
  expect(hasText(tree, es.calendar.title)).toBe(true);
  expect(hasText(tree, es.calendar.jumpToToday)).toBe(true);
  expect(findAll(tree, (p) => p.children === es.calendar.weekdayLetters[2]).length).toBeGreaterThan(0);
});
