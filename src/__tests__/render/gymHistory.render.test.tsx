// Gym session history (PHASE2_ROWS.md row 10 "Gym history") — no render test
// ever mounted this screen before; row 10's own notes relied only on the data-
// layer hydration test added for row 9. This EXECUTES the real screen:
// src/app/gym/history.tsx, whose data comes from useGym() (@/lib/data), which
// hydrates via hydrateGym() calling api.gym.listSessions()/api.gym.streak().
// Mocked at that one module boundary — @/lib/api — so the real hook, mapper
// (sessionsFromApi/streakFromApi) and screen all run.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { useGymStore } from '@/lib/data/gymStore';
import GymHistoryScreen from '@/app/gym/history';
import { act, allText, renderScreen } from './helpers';

const mockListSessions = jest.fn();
const mockStreak = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: {
      listSessions: (...args: unknown[]) => mockListSessions(...args),
      streak: (...args: unknown[]) => mockStreak(...args),
    },
  },
}));

// SkeletonList animates through reanimated's useReducedMotion, which this
// render environment does not provide (same gap noted in
// dashboardSummary.render.test.tsx) — it crashes the moment the hook's
// initial `isLoading: true` render hits it, before any data ever resolves.
// Neither test below is about the loading state, so a plain stand-in is enough.
jest.mock('@/components/display/LoadingSkeleton', () => ({ SkeletonList: () => null }));

// humanDate() (mappers.ts) labels a row "Today" against the real clock, so a
// fixture date only reads back predictably with the clock pinned. setImmediate
// stays real: settle() below needs it to flush hydrateGym's promise chain,
// which a faked one would never auto-advance.
jest.useFakeTimers({ doNotFake: ['setImmediate'] }).setSystemTime(new Date(2026, 10, 20, 9, 0, 0));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const STREAK = { current_streak: 3, longest_streak: 5, last_gym_date: '2026-11-20', freeze_used: false, last_freeze_date: null };

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const renderWithInsets = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GymHistoryScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  useGymStore.getState().reset();
  mockListSessions.mockReset();
  mockStreak.mockReset();
  mockStreak.mockResolvedValue(STREAK);
});

test("renders each fixture session's date, duration and notes", async () => {
  mockListSessions.mockResolvedValue([
    { id: 's1', user_id: 'u1', date: '2026-11-20', name: 'Push day', notes: 'Felt strong', duration_minutes: 45, created_at: '2026-11-20T09:00:00Z' },
    { id: 's2', user_id: 'u1', date: '2026-11-13', name: 'Legs', notes: null, duration_minutes: null, created_at: '2026-11-13T09:00:00Z' },
  ]);

  const tree = renderWithInsets();
  await settle();

  const text = allText(tree);
  // Pinned "today" (2026-11-20) and exactly a week earlier (2026-11-13), a
  // date not special-cased, both rendered by the real humanDate().
  expect(text).toContain('Today');
  expect(text).toContain('Fri 13 Nov');
  expect(text).toContain('45 min');
  expect(text).toContain('Duration not recorded');
  expect(text).toContain('Felt strong');
});

test('renders the empty state when there are no sessions', async () => {
  mockListSessions.mockResolvedValue([]);

  const tree = renderWithInsets();
  await settle();

  const text = allText(tree);
  expect(text).toContain('No sessions yet');
  expect(text).toContain('Log a gym session to start building your history and streak.');
});
