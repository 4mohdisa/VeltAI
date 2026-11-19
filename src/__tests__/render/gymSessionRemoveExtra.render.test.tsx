// Gym log session screen (PHASE2_ROWS.md row 77, gym log entries) — an extra
// exercise picked in error had no way back out: onPickExtra had no remove
// counterpart. This mounts the real screen, adds an extra exercise through
// the exercise picker's own onPick callback (driving ExercisePicker's own
// search UI is that component's concern, not this screen's), removes it, and
// checks: the row disappears, and — since nothing on this screen is sent to
// the server before "Finish workout" — no DELETE request is ever made for it.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GymSessionScreen from '@/app/gym/session';
import type { ExerciseLibraryItem } from '@/lib/api';
import type { PlannedValues } from '@/components/gym/PlannedValuesForm';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

// The shared expo-router mock (render/setup.ts) has no useNavigation — this
// screen is the first render test to need one, for its unsaved-changes guard
// (navigation.addListener('beforeRemove', ...)). Same router/useLocalSearchParams
// shape as the shared mock, plus a no-op navigation.
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

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });

const TODAY = {
  day_of_week: 4,
  day_name: 'Thursday',
  is_rest_day: false,
  template: null,
  exercises: [],
  already_checked_in: false,
  session_id: null,
};

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

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn((url: string) => {
    if (url.includes('/api/gym/today')) return json(TODAY);
    if (url.includes('/api/gym/exercises')) return json([]);
    return json([]);
  });
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
});

test('removing a just-added extra exercise drops it from the list, with no DELETE request', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GymSessionScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const picker = findAll(tree, (p) => typeof p.onPick === 'function')[0];
  act(() => {
    (picker.props.onPick as (ex: ExerciseLibraryItem, planned: PlannedValues) => void)(EXTRA, PLANNED);
  });

  expect(allText(tree)).toContain('Lateral Raise');
  const removeButton = findAll(tree, (p) => p.accessibilityLabel === 'Remove Lateral Raise')[0];
  expect(removeButton).toBeDefined();

  act(() => {
    (removeButton.props.onPress as () => void)();
  });

  expect(allText(tree)).not.toContain('Lateral Raise');
  const deleteCalls = fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'DELETE');
  expect(deleteCalls).toHaveLength(0);
});
