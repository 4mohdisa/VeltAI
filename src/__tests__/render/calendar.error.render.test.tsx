// PHASE3_ROWS.md row 13, Pick a day sheet (src/app/food/calendar.tsx) when the
// logged-days read fails. A failed read shows the shared ErrorState with Retry
// instead of a dotless month that would claim nothing was logged. useLoggedDays
// is stubbed per test so each state is driven directly.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FoodCalendarScreen from '@/app/food/calendar';
import type { LoggedDays } from '@/lib/data/foodDays';
import en from '@/lib/i18n/locales/en.json';
import { allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useFocusEffect: (cb: () => void) => jest.requireActual('react').useEffect(cb, [cb]),
}));

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

const mockLoggedDays = jest.fn<LoggedDays, []>();
jest.mock('@/lib/data/foodDays', () => ({
  ...jest.requireActual('@/lib/data/foodDays'),
  useLoggedDays: () => mockLoggedDays(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const refetch = jest.fn();

function state(error: Error | null): LoggedDays {
  const days: ReadonlySet<string> = new Set<string>();
  return { data: days, days, isLoading: false, loading: false, error, refetch };
}

function renderCalendar() {
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodCalendarScreen />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  refetch.mockClear();
});

test('a failed read shows the error message and a Retry button, not the month', () => {
  mockLoggedDays.mockReturnValue(state(new TypeError('Network request failed')));
  const tree = renderCalendar();

  const text = allText(tree);
  expect(text).toContain(en.calendar.loadFailedTitle);
  expect(text).toContain(en.calendar.loadFailedMessage);
  expect(buttonWithTitle(tree, en.errorState.retry)).toBeDefined();
  expect(text).not.toContain(en.calendar.jumpToToday);
});

test('pressing Retry calls refetch', () => {
  mockLoggedDays.mockReturnValue(state(new TypeError('Network request failed')));
  const tree = renderCalendar();

  (buttonWithTitle(tree, en.errorState.retry)!.props.onPress as () => void)();
  expect(refetch).toHaveBeenCalledTimes(1);
});

test('a successful read shows the month and no error message', () => {
  mockLoggedDays.mockReturnValue(state(null));
  const tree = renderCalendar();

  const text = allText(tree);
  expect(text).not.toContain(en.calendar.loadFailedTitle);
  expect(text).not.toContain(en.calendar.loadFailedMessage);
  expect(text).toContain(en.calendar.jumpToToday);
});
