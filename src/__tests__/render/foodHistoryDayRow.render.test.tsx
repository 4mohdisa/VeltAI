// Row 14b Fix 11: a day row on Meal history opens that day, the same way the
// calendar does: it selects the day in the food store and goes back to Food.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MealHistoryScreen from '@/app/food/history';
import { api } from '@/lib/api';
import { useFoodStore } from '@/lib/data/foodStore';
import { isoDate } from '@/lib/data/foodDays';
import { formatCalories } from '@/lib/formatting';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    api: {
      ...actual.api,
      gym: { listSessions: jest.fn() },
      foodLogs: { summary: jest.fn() },
    },
  };
});

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

test('tapping the Yesterday row selects that day and goes back to Food', async () => {
  (api.gym.listSessions as jest.Mock).mockResolvedValue([]);
  (api.foodLogs.summary as jest.Mock).mockResolvedValue({ calories: 500 });
  const setSelectedDate = jest.spyOn(useFoodStore.getState(), 'setSelectedDate');

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MealHistoryScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  const label = en.history.rowGymMissed
    .replace('{{day}}', en.history.yesterday)
    .replace('{{energy}}', formatCalories(500));
  const row = findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function')[0];
  expect(row).toBeDefined();
  act(() => (row.props.onPress as () => void)());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  expect(setSelectedDate).toHaveBeenCalledWith(isoDate(yesterday));
  expect(router.back).toHaveBeenCalled();
  setSelectedDate.mockRestore();
});
