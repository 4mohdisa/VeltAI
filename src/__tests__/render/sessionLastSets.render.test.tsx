// DESIGN_INTENT.md Fix 4: a session's sets prefill from the last session that
// had the exercise, and from the plan when there is none. Mounts the real
// session screen over a planned 3 × 8 at 60 kg, with GET /api/gym/sessions
// answering the history; same mocks as sessionRemoveSet.render.test.tsx.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GymSessionScreen from '@/app/gym/session';
import en from '@/lib/i18n/locales/en.json';
import { act, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonList: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
  usePathname: () => '/gym/session',
  Href: {},
}));

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

const LAST_SESSION = {
  id: 's1',
  user_id: 'u',
  date: '2026-11-20',
  name: 'Push',
  notes: null,
  duration_minutes: 50,
  created_at: '2026-11-20T10:00:00Z',
  exercises: [
    { id: 'e1', session_id: 's1', name: 'Bench Press', sets: 4, reps: 6, weight: 72.5, weight_unit: 'kg', rest_seconds: null, notes: null },
  ],
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });

type Tree = ReturnType<typeof renderScreen>;

/** Mount with the given history, then press Log so the sets show. */
async function openSets(history: unknown[]): Promise<Tree> {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) => {
    if (url.includes('/api/gym/today')) return json(TODAY);
    if (url.includes('/api/gym/sessions')) return json(history);
    return json([]);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GymSessionScreen />
    </SafeAreaProvider>,
  );
  await act(async () => new Promise((r) => setImmediate(r)));
  act(() => (buttonWithTitle(tree, en.gymSession.log)!.props.onPress as () => void)());
  return tree;
}

/** The figure shown in one value box, e.g. "Set 2 weight". */
const valueIn = (tree: Tree, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label)[0]
    .findAll((n) => typeof n.props.children === 'string')
    .map((n) => n.props.children as string)[0];

const setCount = (tree: Tree) =>
  new Set(findAll(tree, (p) => /^Set \d+ reps$/.test(String(p.accessibilityLabel))).map((n) => n.props.accessibilityLabel)).size;

test('the sets prefill from the last session with the exercise', async () => {
  const tree = await openSets([LAST_SESSION]);
  expect(setCount(tree)).toBe(4);
  expect(valueIn(tree, 'Set 1 reps')).toBe('6');
  expect(valueIn(tree, 'Set 4 weight')).toBe('72.5');
});

test('with no earlier session the sets prefill from the plan', async () => {
  const tree = await openSets([]);
  expect(setCount(tree)).toBe(3);
  expect(valueIn(tree, 'Set 1 reps')).toBe('8');
  expect(valueIn(tree, 'Set 3 weight')).toBe('60');
});
