// Gym "My schedule" weekly plan (PHASE2_ROWS.md row 11, schedule screen only)
// — no render test ever mounted this screen before. This EXECUTES the real
// screen: src/app/gym/schedule.tsx, whose data hooks are useSchedule()
// (api.gym.getSchedule) and useTemplates() (api.gym.getTemplates); choosing a
// day's workout calls api.gym.setScheduleDay. Mocked at that one module
// boundary, so the real hooks and the screen's own choose() logic run.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import ScheduleScreen from '@/app/gym/schedule';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

const mockGetSchedule = jest.fn();
const mockGetTemplates = jest.fn();
const mockSetScheduleDay = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: {
      getSchedule: (...args: unknown[]) => mockGetSchedule(...args),
      getTemplates: (...args: unknown[]) => mockGetTemplates(...args),
      setScheduleDay: (...args: unknown[]) => mockSetScheduleDay(...args),
    },
  },
}));

// Skeleton animates through reanimated's useReducedMotion, which this render
// environment does not provide (same gap noted in gymTemplates.render.test.tsx)
// — it crashes the moment useSchedule()/useTemplates()'s initial `loading:
// true` render hits it, before either fixture ever resolves. Neither test
// below is about the loading state, so a plain stand-in is enough.
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PUSH_DAY_TEMPLATE = {
  id: 't1',
  user_id: 'u1',
  name: 'Push day',
  estimated_duration_minutes: 45,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  exercises: [],
};

const SCHEDULE = WEEK_DAYS.map((day_name, day_of_week) =>
  day_of_week === 1
    ? { day_of_week, day_name, is_rest_day: false, template_id: 't1', template: PUSH_DAY_TEMPLATE }
    : { day_of_week, day_name, is_rest_day: true, template_id: null, template: null },
);

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const renderWithInsets = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ScheduleScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  mockGetSchedule.mockReset();
  mockGetTemplates.mockReset();
  mockSetScheduleDay.mockReset();
  mockGetSchedule.mockResolvedValue(SCHEDULE);
  mockGetTemplates.mockResolvedValue([PUSH_DAY_TEMPLATE]);
});

test('renders the week from the mocked schedule, Monday assigned and the rest as rest days', async () => {
  const tree = renderWithInsets();
  await settle();

  const text = allText(tree);
  expect(text).toContain('My schedule');
  expect(text).toContain('Mon');
  expect(text).toContain('Push day');
  expect(text).toContain('Rest day');
  expect(text).toContain('No workout assigned');
});

test('changing Monday to a rest day calls setScheduleDay with that day and a null template', async () => {
  const tree = renderWithInsets();
  await settle();

  // Opens the sheet for the day whose row carries this label (set by the
  // screen itself: "<day name>, <workout name or 'rest day'>").
  const mondayRow = findAll(tree, (p) => p.accessibilityLabel === 'Monday, Push day')[0];
  expect(mondayRow).toBeDefined();
  await act(async () => {
    (mondayRow.props.onPress as () => void)();
  });

  const restDayOption = findAll(tree, (p) => p.accessibilityLabel === 'Rest day')[0];
  expect(restDayOption).toBeDefined();
  await act(async () => {
    (restDayOption.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockSetScheduleDay).toHaveBeenCalledWith(1, null);
});

// Fix 28: with no workouts the day picker offers New workout, on the route the
// My workouts screen uses; with workouts it does not.
const openTuesday = async (tree: ReturnType<typeof renderWithInsets>) => {
  const row = findAll(
    tree,
    (p) => typeof p.accessibilityLabel === 'string' && (p.accessibilityLabel as string).startsWith('Tuesday,') && typeof p.onPress === 'function',
  )[0];
  expect(row).toBeDefined();
  await act(async () => {
    (row.props.onPress as () => void)();
  });
};
const newWorkoutOption = (tree: ReturnType<typeof renderWithInsets>) =>
  findAll(tree, (p) => p.accessibilityLabel === en.gymTemplates.newWorkoutLabel && typeof p.onPress === 'function')[0];

test('with no workouts the day picker offers New workout and opens the create flow', async () => {
  mockGetSchedule.mockResolvedValue(SCHEDULE.map((d) => ({ ...d, is_rest_day: true, template_id: null, template: null })));
  mockGetTemplates.mockResolvedValue([]);
  const tree = renderWithInsets();
  await settle();
  await openTuesday(tree);

  const option = newWorkoutOption(tree);
  expect(option).toBeDefined();
  expect(allText(tree)).toContain(en.gymTemplates.emptyMessage);
  await act(async () => {
    (option.props.onPress as () => void)();
  });
  expect(router.push).toHaveBeenCalledWith('/gym/new-template');
  expect(mockSetScheduleDay).not.toHaveBeenCalled();
});

test('with workouts the day picker lists them and offers no New workout', async () => {
  const tree = renderWithInsets();
  await settle();
  await openTuesday(tree);

  expect(findAll(tree, (p) => p.accessibilityLabel === 'Push day').length).toBeGreaterThan(0);
  expect(newWorkoutOption(tree)).toBeUndefined();
});
