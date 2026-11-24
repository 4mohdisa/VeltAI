// Gym "Streak freeze" confirmation sheet (PHASE2_ROWS.md row 11, freeze
// screen only) — no render test ever mounted this screen before. This
// EXECUTES the real screen: src/app/gym/freeze.tsx, whose data comes from
// useGym() (@/lib/data), which hydrates via hydrateGym() calling
// api.gym.listSessions()/api.gym.streak(). Mocked at that one module
// boundary — @/lib/api — so the real hook, mapper (streakFromApi) and
// screen all run.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { useGymStore } from '@/lib/data/gymStore';
import FreezeScreen from '@/app/gym/freeze';
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
      <FreezeScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  useGymStore.getState().reset();
  mockListSessions.mockReset();
  mockStreak.mockReset();
  mockListSessions.mockResolvedValue([]);
});

test('renders the confirm copy with the real freeze count and streak length', async () => {
  mockStreak.mockResolvedValue({
    current_streak: 12,
    longest_streak: 20,
    total_days: 20,
    last_gym_date: null,
    freeze_used: false,
    last_freeze_date: null,
  });

  const tree = renderWithInsets();
  await settle();

  const text = allText(tree);
  expect(text).toContain('Streak freeze');
  expect(text).toContain('Use 1 of your 1 freezes for today?');
  expect(text).toContain('A freeze protects your 12-day streak on a planned rest day — it just keeps the streak alive.');
});

test('renders zero freezes available once this streak has already used its freeze', async () => {
  mockStreak.mockResolvedValue({
    current_streak: 5,
    longest_streak: 20,
    total_days: 20,
    last_gym_date: null,
    freeze_used: true,
    last_freeze_date: '2026-11-10',
  });

  const tree = renderWithInsets();
  await settle();

  const text = allText(tree);
  expect(text).toContain('Use 1 of your 0 freezes for today?');
  expect(text).toContain('A freeze protects your 5-day streak on a planned rest day — it just keeps the streak alive.');
});
