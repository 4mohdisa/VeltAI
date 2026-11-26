// DESIGN_INTENT.md Fix 2: Summary "Today" always shows today. useDailyMacros and
// useFibreConsumed read today's rows from the food store, whatever day the Food
// tab is showing. A probe component mounts the real hooks over the real store;
// the clock is fixed so "today" and "yesterday" are known days.
import { Text } from 'react-native';

import { useDailyMacros, useFibreConsumed } from '@/lib/data';
import { useFoodStore } from '@/lib/data/foodStore';
import { act, allText, renderScreen } from './helpers';

const TODAY = '2026-11-27';
const YESTERDAY = '2026-11-26';

/** Prints the two values Summary reads, as "kcal / fibre". */
function Probe() {
  const macros = useDailyMacros();
  const fibre = useFibreConsumed();
  return <Text>{`${macros.calories.consumed} kcal / ${fibre} g fibre`}</Text>;
}

beforeAll(() => {
  jest.useFakeTimers({
    now: new Date(2026, 10, 27, 12, 0, 0),
    doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'performance', 'hrtime'],
  });
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  const store = useFoodStore.getState();
  store.reset();
  store.setDayMeals(TODAY, []);
  store.setDayMeals(YESTERDAY, []);
  const item = { quantityG: 100, protein: 0, carbs: 0, fat: 0 };
  store.logMeal('Lunch', { ...item, name: 'Today soup', calories: 300, fibre: 4 }, 'manual', false, TODAY);
  store.logMeal('Dinner', { ...item, name: 'Yesterday pasta', calories: 800, fibre: 9 }, 'manual', false, YESTERDAY);
});

test('with no day chosen on the Food tab, Summary shows today', () => {
  expect(allText(renderScreen(<Probe />))).toContain('300 kcal / 4 g fibre');
});

test('a past day chosen on the Food tab still leaves Summary on today', () => {
  const tree = renderScreen(<Probe />);
  act(() => useFoodStore.getState().setSelectedDate(YESTERDAY));
  expect(useFoodStore.getState().meals.reduce((sum, m) => sum + m.calories, 0)).toBe(800);
  expect(allText(tree)).toContain('300 kcal / 4 g fibre');
});
