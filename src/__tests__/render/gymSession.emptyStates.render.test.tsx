// PHASE3_ROWS.md row 14, Gym log session screen (src/app/gym/session.tsx) states
// with no exercises. Mounts the real screen with fetch stubbed and checks each
// no-data state shows its own copy from en.json: nothing scheduled, a rest day,
// and a failed read of today, which must not read as "Nothing scheduled". The
// header copy is checked in English and again in Spanish. The unsaved-changes
// alert and its "Progress saved" toast are checked against en.json too.
import { Alert } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GymSessionScreen from '@/app/gym/session';
import { useToastStore } from '@/components/display/toastStore';
import type { PlannedValues } from '@/components/gym/PlannedValuesForm';
import type { ExerciseLibraryItem } from '@/lib/api';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

const mockAddListener = jest.fn((_event: string, _cb: (e: unknown) => void) => jest.fn());
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ addListener: mockAddListener, dispatch: jest.fn() }),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
  usePathname: () => '/gym/session',
  Href: {},
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });
// A 4xx is not retried (src/lib/api.ts retries only network errors and 5xx), so the failure lands at once.
const failed = () => Promise.resolve({ ok: false, status: 400, json: async () => ({ data: null, error: 'Bad request' }) });

const today = (isRestDay: boolean) => ({
  day_of_week: 4,
  day_name: 'Thursday',
  is_rest_day: isRestDay,
  template: null,
  exercises: [],
  already_checked_in: false,
  session_id: null,
});

/** Mounts the screen with /api/gym/today answering `todayResponse`. */
async function renderSession(todayResponse: () => Promise<unknown>) {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
    url.includes('/api/gym/today') ? todayResponse() : json([]),
  );
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GymSessionScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderSession>>;

const EXTRA: ExerciseLibraryItem = {
  id: 'ex1',
  name: 'Lateral Raise',
  muscle_group_primary: 'shoulders',
  muscle_groups_secondary: [],
  category: 'isolation',
  exercise_type: 'strength',
  equipment: 'dumbbell',
  difficulty: 'beginner',
  description: '',
  met_value: 3,
};
const PLANNED: PlannedValues = { sets: 3, reps: 12, weight: 10, weight_unit: 'kg' };

/** Adds EXTRA through the exercise picker's own onPick callback. */
const pickExtra = (tree: Tree) => {
  const picker = findAll(tree, (p) => typeof p.onPick === 'function')[0];
  act(() => {
    (picker.props.onPick as (ex: ExerciseLibraryItem, values: PlannedValues) => void)(EXTRA, PLANNED);
  });
};
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const hasButton = (tree: Tree, title: string) => findAll(tree, (p) => p.title === title).length > 0;

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('a day with nothing scheduled shows the empty state with one Add an exercise action', async () => {
  const tree = await renderSession(() => json(today(false)));
  expect(hasText(tree, en.gymSession.nothingScheduled)).toBe(true);
  expect(hasText(tree, en.gymSession.emptyMessage)).toBe(true);
  expect(hasButton(tree, en.gymSession.addExercise)).toBe(true);
  expect(hasText(tree, en.gymSession.eyebrow)).toBe(true);
  expect(hasText(tree, en.gymSession.defaultTitle)).toBe(true);
});

test('Spanish: the header and empty state switch to es.json', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = await renderSession(() => json(today(false)));
  expect(hasText(tree, es.gymSession.defaultTitle)).toBe(true);
  expect(hasText(tree, es.gymSession.nothingScheduled)).toBe(true);
});

test('a rest day reuses the gymLog rest-day title', async () => {
  const tree = await renderSession(() => json(today(true)));
  expect(hasText(tree, en.gymLog.restDayTitle)).toBe(true);
  expect(hasText(tree, en.gymSession.nothingScheduled)).toBe(false);
});

test('a failed read of today shows the load failure, not "Nothing scheduled"', async () => {
  const tree = await renderSession(failed);
  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.gymSession.nothingScheduled)).toBe(false);
});

type AlertButton = { text: string; onPress?: () => void };

test('leaving after adding an exercise asks to save, and Save shows the Progress saved toast', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const tree = await renderSession(() => json(today(false)));

  // A picked extra starts ticked, so the session now has unsaved progress.
  pickExtra(tree);

  const beforeRemove = mockAddListener.mock.calls.filter(([event]) => event === 'beforeRemove').at(-1)?.[1];
  expect(beforeRemove).toBeDefined();
  act(() => {
    beforeRemove?.({ preventDefault: jest.fn(), data: { action: {} } });
  });

  expect(alertSpy).toHaveBeenCalledTimes(1);
  const [title, message, buttons] = alertSpy.mock.calls[0] as [string, string, AlertButton[]];
  expect(title).toBe(en.gymSession.unsavedTitle);
  expect(message).toBe(en.gymSession.unsavedMessage);
  expect(buttons.map((b) => b.text)).toEqual([en.gymSession.discard, en.gymSession.save, en.gymSession.keepEditing]);

  await act(async () => {
    buttons[1].onPress?.();
  });
  expect(useToastStore.getState().current?.message).toBe(en.gymSession.progressSaved);
  alertSpy.mockRestore();
});

test('row labels, the log controls and the number pad read from en.json', async () => {
  const planned = (id: string, exercise: Partial<ExerciseLibraryItem> | undefined, sets: number | null) => ({
    id,
    template_id: 't1',
    exercise_id: id,
    planned_sets: sets,
    planned_reps: sets ? 8 : null,
    planned_weight: null,
    planned_weight_unit: null,
    planned_duration_minutes: null,
    rest_seconds: null,
    sort_order: 0,
    created_at: '2026-11-20T00:00:00Z',
    exercise,
  });
  const tree = await renderSession(() =>
    json({
      ...today(false),
      exercises: [planned('te1', undefined, 3), planned('te2', { name: 'Treadmill', exercise_type: 'cardio' }, null)],
    }),
  );
  const fallback = en.gymSession.exerciseFallback;
  const withName = (text: string, name: string) => text.replace('{{name}}', name);
  const hasLabel = (label: string) => findAll(tree, (p) => p.accessibilityLabel === label).length > 0;
  const joined = (p: Record<string, unknown>) => (Array.isArray(p.children) ? p.children.join('') : p.children);

  expect(findAll(tree, (p) => joined(p) === fallback).length).toBeGreaterThan(0);
  expect(hasText(tree, en.gymSession.cardio)).toBe(true);
  expect(hasLabel(withName(en.gymSession.rowNotDone, fallback))).toBe(true);
  expect(hasLabel(withName(en.gymSession.viewProgress, fallback))).toBe(true);

  const log = findAll(tree, (p) => p.title === en.gymSession.log && typeof p.onPress === 'function')[0];
  act(() => {
    (log.props.onPress as () => void)();
  });
  expect(hasButton(tree, en.gymSession.hide)).toBe(true);
  expect(hasButton(tree, en.gymSession.addSet)).toBe(true);
  expect(hasText(tree, en.gymSession.notSet)).toBe(true);
  expect(hasText(tree, en.gymSession.unitReps)).toBe(true);
  expect(hasText(tree, en.gymSession.unitKg)).toBe(true);

  const repsBox = findAll(tree, (p) => p.accessibilityLabel === en.gymSession.setRepsLabel.replace('{{n}}', '1') && typeof p.onPress === 'function')[0];
  act(() => {
    (repsBox.props.onPress as () => void)();
  });
  expect(findAll(tree, (p) => p.label === en.gymSession.padReps).length).toBeGreaterThan(0);

  pickExtra(tree);
  expect(findAll(tree, (p) => joined(p) === `${EXTRA.name}  ${en.gymSession.added}`).length).toBeGreaterThan(0);
  expect(hasLabel(withName(en.gymSession.rowDone, EXTRA.name))).toBe(true);
});
