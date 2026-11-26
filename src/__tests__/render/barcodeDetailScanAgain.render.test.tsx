// DESIGN_INTENT.md Fix list 1, barcode detail sheet: "Scan again" on a product
// that was not found keeps the meal, so a rescan from a meal's "Add to dinner"
// still logs to dinner. Mounts the real detail sheet in barcode mode with the
// router and lookup mocked, as barcodeDetailSlot.render.test.tsx does.
import { router } from 'expo-router';

import FoodDetailScreen from '@/app/food/detail';
import { openFoodDetail, useDetailSubject } from '@/lib/food/detailSubject';
import i18n from '@/lib/i18n';
import type { MealSlot } from '@/lib/mock/data';
import { act, buttonWithTitle, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  lookupBarcodeResult: jest.fn(async () => ({ status: 'notFound' })),
}));
// The barcode loading state animates through reanimated, as in barcodeScan.render.test.tsx.
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonList: () => null }));

beforeEach(() => {
  jest.mocked(router.replace).mockClear();
  useDetailSubject.getState().clearDetail();
});

/** Open an unknown product on the sheet and press "Scan again". */
async function scanAgain(slot?: MealSlot) {
  openFoodDetail({ mode: 'barcode', code: '9300605000000', ...(slot ? { slot } : {}) });
  const tree = renderScreen(<FoodDetailScreen />);
  await act(async () => new Promise((r) => setImmediate(r)));
  const button = buttonWithTitle(tree, i18n.t('food.scanAgain'));
  act(() => (button!.props.onPress as () => void)());
}

test('scanning again for dinner reopens the scanner for dinner', async () => {
  await scanAgain('Dinner');
  expect(router.replace).toHaveBeenCalledWith('/food/barcode-scan?slot=Dinner');
});

test('with no meal chosen, scanning again adds no slot', async () => {
  await scanAgain();
  expect(router.replace).toHaveBeenCalledWith('/food/barcode-scan');
});
