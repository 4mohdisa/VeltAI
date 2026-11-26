// Row 14b Fix 7: the Gym tab's log button shows on every day that has no
// session yet, not only on a day with a scheduled workout. The tab always shows
// today; the calendar only pages months, so a past month is the one other view.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GymLogScreen from '@/app/(tabs)/gym';
import { useGymStore } from '@/lib/data/gymStore';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (cb: () => void) => jest.requireActual('react').useEffect(cb, [cb]),
  usePathname: () => '/(tabs)/gym',
  Href: {},
}));

// Without metrics the provider renders nothing until it measures, which never happens here.
const METRICS: Metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });

// The last session was the day before the pinned clock, so today has none.
const STREAK = {
  current_streak: 3,
  longest_streak: 5,
  total_days: 5,
  last_gym_date: '2026-11-19',
  freeze_used: false,
  last_freeze_date: null,
};

const REST_DAY = {
  day_of_week: 5,
  day_name: 'Friday',
  is_rest_day: true,
  template: null,
  exercises: [],
  already_checked_in: false,
  session_id: null,
};

const EMPTY_PLAN = {
  ...REST_DAY,
  is_rest_day: false,
  template: {
    id: 'tmpl1',
    user_id: 'u1',
    name: 'Push day',
    estimated_duration_minutes: 45,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    exercises: [],
  },
};

jest.useFakeTimers({ doNotFake: ['setImmediate'] }).setSystemTime(new Date(2026, 10, 20, 9, 0, 0));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function renderGym(today: unknown) {
  useGymStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) => {
    if (url.includes('/api/gym/streak')) return json(STREAK);
    if (url.includes('/api/gym/patterns')) return json(null);
    if (url.includes('/api/gym/today')) return json(today);
    return json([]);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GymLogScreen />
    </SafeAreaProvider>,
  );
  await settle();
  await settle();
  return tree;
}

const logButton = (tree: Awaited<ReturnType<typeof renderGym>>) =>
  findAll(tree, (p) => p.accessibilityLabel === en.gym.logThisSession && typeof p.onPress === 'function')[0];

test.each([
  ['a rest day with no session', REST_DAY],
  ['a planned day with no exercises', EMPTY_PLAN],
])('%s shows the log button, which opens log session', async (_label, today) => {
  const tree = await renderGym(today);
  const button = logButton(tree);
  expect(button).toBeDefined();
  act(() => (button.props.onPress as () => void)());
  expect(router.push).toHaveBeenCalledWith('/gym/log-session');
});

test('the log button stays while a past month is on the calendar', async () => {
  const tree = await renderGym(REST_DAY);
  const prev = findAll(tree, (p) => p.accessibilityLabel === en.calendar.previousMonth && typeof p.onPress === 'function')[0];
  act(() => (prev.props.onPress as () => void)());
  await settle();
  expect(logButton(tree)).toBeDefined();
});
