// DESIGN_INTENT.md Fix 3: a set can be removed in a session, so logging 1 of 3
// planned sets is possible. Mounts the real session screen over a planned day
// with one 3 × 8 exercise, with logGymSession mocked to read what Finish saves.
// Same router, motion and skeleton mocks as gymSessionRemoveExtra.render.test.tsx.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GymSessionScreen from '@/app/gym/session';
import { logGymSession } from '@/lib/data';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonList: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
  usePathname: () => '/gym/session',
  Href: {},
}));
jest.mock('@/lib/data', () => ({ ...jest.requireActual('@/lib/data'), logGymSession: jest.fn() }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const TODAY = {
  day_of_week: 4,
  day_name: 'Thursday',
  is_rest_day: false,
  template: { id: 't1', name: 'Push', estimated_duration_minutes: 45 },
  exercises: [
    {
      id: 'te1',
      exercise: { id: 'ex1', name: 'Bench Press', exercise_type: 'strength' },
      planned_sets: 3,
      planned_reps: 8,
      planned_weight: 60,
      planned_weight_unit: 'kg',
    },
  ],
  already_checked_in: false,
  session_id: null,
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });

beforeEach(() => {
  jest.mocked(logGymSession).mockClear();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
    json(url.includes('/api/gym/today') ? TODAY : []),
  );
});

type Tree = ReturnType<typeof renderScreen>;
const byLabel = (tree: Tree, label: string) => findAll(tree, (p) => p.accessibilityLabel === label)[0];
const press = (node: { props: Record<string, unknown> }) => act(() => (node.props.onPress as () => void)());
const removeSet = (tree: Tree, n: number) => press(byLabel(tree, en.gymSession.removeSet.replace('{{n}}', String(n))));
/** Each button shows up at several tree levels, so count distinct labels. */
const setCount = (tree: Tree) =>
  new Set(findAll(tree, (p) => /^Remove set \d+$/.test(String(p.accessibilityLabel))).map((n) => n.props.accessibilityLabel)).size;

/** The session with the exercise's Log pressed, so its three planned sets show. */
async function openSets(): Promise<Tree> {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GymSessionScreen />
    </SafeAreaProvider>,
  );
  await act(async () => new Promise((r) => setImmediate(r)));
  press(buttonWithTitle(tree, en.gymSession.log)!);
  return tree;
}

/** Type a weight into one set through the screen's number pad. */
function typeWeight(tree: Tree, n: number, weight: string) {
  press(byLabel(tree, en.gymSession.setWeightLabel.replace('{{n}}', String(n))));
  const pad = findAll(tree, (p) => typeof p.onChange === 'function' && p.mode === 'decimal')[0];
  act(() => (pad.props.onChange as (text: string) => void)(weight));
  act(() => (pad.props.onDone as () => void)());
}

const savedExercises = () => jest.mocked(logGymSession).mock.calls[0][1]?.exercises;

test('removing a planned set that was not typed into leaves the other two', async () => {
  const tree = await openSets();
  expect(setCount(tree)).toBe(3);
  removeSet(tree, 3);
  expect(setCount(tree)).toBe(2);
  expect(allText(tree)).not.toContain('Set 3');
});

test('removing a set that was typed into drops its value and moves the next set up', async () => {
  const tree = await openSets();
  typeWeight(tree, 1, '80');
  typeWeight(tree, 2, '70');
  removeSet(tree, 1);
  expect(setCount(tree)).toBe(2);
  press(buttonWithTitle(tree, en.gymSession.finish)!);
  // The removed set held the top weight (80), so a top weight of 70 means it is gone.
  expect(savedExercises()).toEqual([expect.objectContaining({ name: 'Bench Press', sets: 2, weight: 70 })]);
});

test('finishing with 1 of 3 sets saves only that one set', async () => {
  const tree = await openSets();
  removeSet(tree, 3);
  removeSet(tree, 2);
  press(buttonWithTitle(tree, en.gymSession.finish)!);
  expect(savedExercises()).toEqual([expect.objectContaining({ name: 'Bench Press', sets: 1, reps: 8, weight: 60 })]);
});

test('removing every set shows the empty note and saves nothing for the exercise', async () => {
  const tree = await openSets();
  removeSet(tree, 3);
  removeSet(tree, 2);
  removeSet(tree, 1);
  expect(setCount(tree)).toBe(0);
  expect(allText(tree)).toContain(en.gymSession.noSets);
  expect(byLabel(tree, en.gymSession.rowNotDone.replace('{{name}}', 'Bench Press'))).toBeDefined();
  press(buttonWithTitle(tree, en.gymSession.finish)!);
  expect(savedExercises()).toEqual([]);
});
