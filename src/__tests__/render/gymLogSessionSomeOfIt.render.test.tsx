// PHASE3_ROWS.md row 14, gym/log-session "Only some of it" sheet: its copy
// (title, subtitle, row details, the log button and its caption) comes from the
// gymSomeOfIt keys, so it follows the app language in en, es and fr. Text is
// collected with findAll, as the gym screens' lists break allText.
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import LogSessionScreen from '@/app/gym/log-session';
import { useToday } from '@/lib/data/gymSchedule';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({ useToday: jest.fn() }));
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useGym: () => ({
    data: { streak: { gymLoggedToday: false }, loggedDays: [], frozenDates: [], sessions: [] },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const planned = (id: string, name: string, type: 'strength' | 'cardio', extra: Record<string, unknown>) => ({
  id,
  template_id: 'tmpl1',
  exercise_id: `ex-${id}`,
  planned_sets: null,
  planned_reps: null,
  planned_weight: null,
  planned_weight_unit: null,
  planned_duration_minutes: null,
  rest_seconds: null,
  sort_order: 0,
  created_at: '2026-11-01T00:00:00Z',
  exercise: { id: `ex-${id}`, name, exercise_type: type },
  ...extra,
});

const TODAY = {
  day_of_week: 1,
  day_name: 'Monday',
  is_rest_day: false,
  template: { id: 'tmpl1', name: 'Push day', exercises: [] },
  exercises: [
    planned('te1', 'Bench press', 'strength', { planned_sets: 3, planned_reps: 10, planned_weight: 60, planned_weight_unit: 'kg' }),
    planned('te2', 'Push-up', 'strength', { planned_sets: 2, planned_reps: 15 }),
    planned('te3', 'Rowing', 'cardio', { planned_duration_minutes: 20 }),
  ],
  already_checked_in: false,
  session_id: null,
};

const LOCALES = { en, es, fr } as const;
type Locale = (typeof LOCALES)[keyof typeof LOCALES];

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{{${k}}}`, String(v)), template);

const render = (el: ReactElement) => renderScreen(<SafeAreaProvider initialMetrics={METRICS}>{el}</SafeAreaProvider>);
type Tree = ReturnType<typeof render>;

const texts = (tree: Tree) =>
  findAll(tree, (p) => typeof p.children === 'string').map((n) => n.props.children as string);
const hasText = (tree: Tree, text: string) => texts(tree).includes(text);
const hasTitle = (tree: Tree, title: string) => findAll(tree, (p) => p.title === title).length > 0;

async function openSheet(lang: keyof typeof LOCALES, copy: Locale) {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const tree = render(<LogSessionScreen />);
  const tile = findAll(tree, (p) => p.accessibilityLabel === `${copy.gymLog.onlySome}. ${copy.gymLog.onlySomeSub}`)[0];
  await act(async () => {
    (tile.props.onPress as () => void)();
  });
  return tree;
}

const tap = async (tree: Tree, label: string) => {
  const row = findAll(tree, (p) => p.accessibilityRole === 'checkbox' && String(p.accessibilityLabel).startsWith(label))[0];
  await act(async () => {
    (row.props.onPress as () => void)();
  });
};

beforeEach(() => {
  (useToday as jest.Mock).mockReturnValue({ today: TODAY, loading: false, refetch: jest.fn() });
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe.each(Object.keys(LOCALES) as (keyof typeof LOCALES)[])('%s', (lang) => {
  const copy = LOCALES[lang];

  test('everything ticked: title, subtitle, row details, log button and caption', async () => {
    const tree = await openSheet(lang, copy);
    const some = copy.gymSomeOfIt;
    expect(hasText(tree, some.title)).toBe(true);
    expect(hasText(tree, some.subtitle)).toBe(true);
    expect(hasText(tree, fill(some.strengthDetail, { sets: 3, reps: 10, load: '60 kg' }))).toBe(true);
    expect(hasText(tree, fill(some.strengthDetail, { sets: 2, reps: 15, load: some.bodyweight }))).toBe(true);
    expect(hasText(tree, fill(some.cardioPlanned, { minutes: 20 }))).toBe(true);
    expect(hasTitle(tree, fill(some.log_other, { count: 3 }))).toBe(true);
    expect(hasText(tree, some.allTicked)).toBe(true);
  });

  test('one unticked: the log count drops and the caption says one is left out', async () => {
    const tree = await openSheet(lang, copy);
    await tap(tree, 'Rowing');
    const some = copy.gymSomeOfIt;
    expect(hasTitle(tree, fill(some.log_other, { count: 2 }))).toBe(true);
    expect(hasText(tree, fill(some.leftOut_one, { count: 1 }))).toBe(true);
  });

  test('nothing ticked: the button and caption ask for at least one', async () => {
    const tree = await openSheet(lang, copy);
    await tap(tree, 'Bench press');
    await tap(tree, 'Push-up');
    await tap(tree, 'Rowing');
    const some = copy.gymSomeOfIt;
    expect(hasTitle(tree, some.nothingTicked)).toBe(true);
    expect(hasText(tree, some.tickOne)).toBe(true);
  });
});
