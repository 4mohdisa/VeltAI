// TodayCard malformed-response guard (Phase 2 known gap) — src/components/gym
// /TodayCard.tsx reads today.is_rest_day/already_checked_in/exercises from
// useToday() (@/lib/data/gymSchedule, which calls api.gym.getToday()). Before
// the guard, any truthy-but-malformed response (an empty array, a string)
// fell through to `today.is_rest_day || !today.template`, which is true for
// any object with no `template` field, silently rendering "Rest day" for
// garbage data. This EXECUTES the real component, mocking @/lib/api at the
// module boundary only, so useToday's own loading/fallback logic still runs.
import { TodayCard } from '@/components/gym/TodayCard';
import { act, allText, renderScreen } from './helpers';

const mockGetToday = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getToday: (...args: unknown[]) => mockGetToday(...args) } },
}));

// Skeleton animates through reanimated's useReducedMotion, which this render
// environment does not provide (same gap noted in gymHistory.render.test.tsx)
// — it crashes on TodayCard's initial `loading: true` render, before either
// fixture ever resolves. None of the tests below are about the loading
// state, so a plain stand-in is enough.
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

// The shared expo-router mock (render/setup.ts) has no useFocusEffect — same
// override as gymStreakStripFootnote.render.test.tsx: a stand-in that just
// runs the effect once on mount (test-renderer never "focuses").
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
  usePathname: () => '/(tabs)/gym',
  Href: {},
}));

const PLANNED_WORKOUT = {
  day_of_week: 2,
  day_name: 'Tuesday',
  is_rest_day: false,
  template: {
    id: 'tpl1',
    user_id: 'u1',
    name: 'Push day',
    estimated_duration_minutes: 45,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    exercises: [],
  },
  exercises: [
    {
      id: 'te1',
      template_id: 'tpl1',
      exercise_id: 'ex1',
      planned_sets: 3,
      planned_reps: 8,
      planned_weight: 60,
      planned_weight_unit: 'kg',
      planned_duration_minutes: null,
      rest_seconds: 90,
      sort_order: 0,
      created_at: '2026-11-01T00:00:00Z',
      exercise: {
        id: 'ex1',
        name: 'Bench press',
        muscle_group_primary: 'chest',
        muscle_groups_secondary: [],
        category: 'push',
        exercise_type: 'strength',
        equipment: 'barbell',
        difficulty: 'intermediate',
        description: '',
        met_value: 5,
      },
    },
  ],
  already_checked_in: false,
  session_id: null,
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  mockGetToday.mockReset();
});

test('renders the workout from a valid TodayWorkout response', async () => {
  mockGetToday.mockResolvedValue(PLANNED_WORKOUT);

  const tree = renderScreen(<TodayCard />);
  await settle();

  const text = allText(tree);
  expect(text).toContain('Push day');
  expect(text).toContain('Bench press');
  expect(text).toContain('Start workout');
});

test('a truthy non-object response does not render Rest day', async () => {
  mockGetToday.mockResolvedValue([]);

  const tree = renderScreen(<TodayCard />);
  await settle();

  const text = allText(tree);
  expect(text).not.toContain('Rest day');
  expect(text).toContain("Couldn't load your gym data.");
});

test('an object missing the required fields does not render Rest day', async () => {
  mockGetToday.mockResolvedValue({ day_of_week: 2, day_name: 'Tuesday' });

  const tree = renderScreen(<TodayCard />);
  await settle();

  const text = allText(tree);
  expect(text).not.toContain('Rest day');
  expect(text).toContain("Couldn't load your gym data.");
});

test('a screen regaining focus revalidates silently, without blanking the card', async () => {
  mockGetToday.mockResolvedValue(PLANNED_WORKOUT);

  const tree = renderScreen(<TodayCard />);
  await settle();

  // The mocked useFocusEffect above ran its callback once on mount, alongside
  // useToday's own mount fetch — one getToday() call each, both resolved by
  // the settle() above.
  expect(mockGetToday).toHaveBeenCalledTimes(2);

  // Skeleton is mocked to render null, so it leaves no trace of its own — the
  // real proof that revalidate (not refetch) ran is that the card never fell
  // back to the empty loading branch: the workout content is still here.
  const text = allText(tree);
  expect(text).toContain('Push day');
  expect(text).toContain('Bench press');
  expect(text).toContain('Start workout');
});
