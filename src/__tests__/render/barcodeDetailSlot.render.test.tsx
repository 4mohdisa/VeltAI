// DESIGN_INTENT.md Fix list 1, barcode detail sheet: a product scanned from a
// meal's "Add to dinner" is logged to dinner. Mounts the real detail sheet in
// barcode mode with the lookup and logMeal mocked (no network), the same way
// barcodeScanSlot.render.test.tsx does; the clock is fixed at 8 am, a breakfast hour.
import FoodDetailScreen from '@/app/food/detail';
import { logMeal } from '@/lib/data';
import { openFoodDetail, useDetailSubject } from '@/lib/food/detailSubject';
import i18n from '@/lib/i18n';
import { mealSlotName } from '@/lib/mealSlotName';
import type { MealSlot } from '@/lib/mock/data';
import { act, buttonWithTitle, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  lookupBarcodeResult: jest.fn(async () => ({
    status: 'found',
    product: { name: 'Greek Yoghurt', kcalPer100: 59, proteinPer100: 10, carbsPer100: 4, fatPer100: 0, servingOptions: [170] },
  })),
  logMeal: jest.fn(),
}));
// The barcode loading state animates through reanimated, as in barcodeScan.render.test.tsx.
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonList: () => null }));

// Only Date is faked, so the render and its async flushes run on real timers.
beforeAll(() => {
  jest.useFakeTimers({
    now: new Date(2026, 10, 27, 8, 0, 0),
    doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'performance', 'hrtime'],
  });
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.mocked(logMeal).mockClear();
  useDetailSubject.getState().clearDetail();
});

/** Open the scanned product on the sheet and press its "Add to <meal>" button. */
async function logFrom(slot: MealSlot | undefined, expected: MealSlot) {
  openFoodDetail({ mode: 'barcode', code: '9300605000000', ...(slot ? { slot } : {}) });
  const tree = renderScreen(<FoodDetailScreen />);
  await act(async () => new Promise((r) => setImmediate(r)));
  const cta = buttonWithTitle(tree, i18n.t('addMenu.addToSlot', { slot: mealSlotName(i18n.t, expected).toLowerCase() }));
  act(() => (cta!.props.onPress as () => void)());
}

test('a product scanned for dinner is logged to dinner', async () => {
  await logFrom('Dinner', 'Dinner');
  expect(jest.mocked(logMeal).mock.calls[0][0]).toBe('Dinner');
});

test('with no meal chosen, the product goes to the meal for the time of day', async () => {
  await logFrom(undefined, 'Breakfast');
  expect(jest.mocked(logMeal).mock.calls[0][0]).toBe('Breakfast');
});
