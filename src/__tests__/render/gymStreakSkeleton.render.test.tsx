// PHASE3_ROWS.md row 14, Gym tab streak strip: while the first gym read runs
// with nothing stored, the strip shows a skeleton instead of a "0 day streak"
// that would read as real; once the read lands, the skeleton gives way to the
// count. The data hooks are mocked at their module boundary, as in
// gymCards.emptyStates.render.test.tsx; the tab's cards are stubbed because
// this test is about the strip alone.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import type { ReactTestInstance } from 'react-test-renderer';

import GymLogScreen from '@/app/(tabs)/gym';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

type GymState = { isLoading: boolean; streak: Record<string, unknown> };
const EMPTY_STREAK = { current: 0, longest: 0, totalGymDays: 0, freezesAvailable: 0, gymLoggedToday: false, freezeDate: null };
let mockGym: GymState = { isLoading: true, streak: EMPTY_STREAK };

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useGym: () => ({
    data: { streak: mockGym.streak, loggedDays: [], frozenDates: [], sessions: [] },
    isLoading: mockGym.isLoading,
    error: null,
    refetch: jest.fn(),
  }),
}));
jest.mock('@/lib/data/gymSchedule', () => ({
  useToday: () => ({ today: null, loading: false, isError: false, refetch: jest.fn(), revalidate: jest.fn() }),
}));
jest.mock('@/lib/data/gymRange', () => ({
  ...jest.requireActual('@/lib/data/gymRange'),
  useGymMonth: () => ({ sessions: [], loading: false, error: null, refetch: jest.fn() }),
}));
jest.mock('@/components/gym', () => ({
  TodayCard: () => null,
  MuscleChart: () => null,
  MyScheduleCard: () => null,
  GymPatternsCard: () => null,
}));
// A host stand-in the test can find (the real Skeleton needs reanimated's useReducedMotion).
jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => jest.requireActual('react').createElement('View', { testID: 'skeleton' }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (cb: () => void) => jest.requireActual('react').useEffect(cb, [cb]),
  usePathname: () => '/(tabs)/gym',
  Href: {},
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const screen = () => (
  <SafeAreaProvider initialMetrics={METRICS}>
    <GymLogScreen />
  </SafeAreaProvider>
);

const fill = (template: string, count: number) => template.replace('{{count}}', String(count));

/** The streak strip card, found by the label the screen gives it. */
function strip(tree: ReturnType<typeof renderScreen>, count: number): ReactTestInstance {
  return findAll(tree, (p) => p.accessibilityLabel === fill(en.gym.streakDetailLabel_other, count))[0];
}
/** Every string or number child in the strip (the count renders as a number). */
const stripTexts = (card: ReactTestInstance) =>
  card
    .findAll((n) => typeof n.props.children === 'string' || typeof n.props.children === 'number')
    .map((n) => String(n.props.children));
const hasSkeleton = (card: ReactTestInstance) => card.findAll((n) => n.props.testID === 'skeleton').length > 0;

beforeEach(() => {
  mockGym = { isLoading: true, streak: EMPTY_STREAK };
});

test('first read pending with nothing stored: the strip shows the skeleton, not "0 day streak"', () => {
  const card = strip(renderScreen(screen()), 0);
  expect(card).toBeDefined();
  expect(hasSkeleton(card)).toBe(true);
  expect(stripTexts(card)).not.toContain(en.gym.dayStreak_other);
  expect(stripTexts(card)).not.toContain('0');
});

test('once the read resolves with a streak, the skeleton is gone and the count shows', () => {
  const tree = renderScreen(screen());
  expect(hasSkeleton(strip(tree, 0))).toBe(true);

  mockGym = {
    isLoading: false,
    streak: { ...EMPTY_STREAK, current: 12, longest: 20, totalGymDays: 34, freezesAvailable: 1 },
  };
  act(() => {
    tree.update(screen());
  });

  const card = strip(tree, 12);
  expect(card).toBeDefined();
  expect(hasSkeleton(card)).toBe(false);
  const text = stripTexts(card);
  expect(text).toContain('12');
  expect(text).toContain(en.gym.dayStreak_other);
});
