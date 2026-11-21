// Food "My dishes" (saved foods) screen (PHASE2_ROWS.md row 8 "Saved foods /
// recipes / meals") — no render test existed for this screen before. This
// EXECUTES the real screen; it is not a source-text grep.
import type { ReactNode, Ref } from 'react';
import { Alert } from 'react-native';

import SavedFoodsScreen from '@/app/food/saved';
import { useSavedFoods } from '@/lib/data';
import { act, allText, findAll, renderScreen } from './helpers';

const mockUnsaveFood = jest.fn();
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useSavedFoods: jest.fn(() => ({ data: [], isLoading: false, error: null, refetch: jest.fn() })),
  unsaveFood: (...args: unknown[]) => mockUnsaveFood(...args),
}));

// The real ReanimatedSwipeable's ref.close() runs a worklet, which this
// render environment does not provide (same reanimated gap already noted for
// this component's console warning). The delete test needs renderRightActions
// rendered (for the "Unsave" control) and a ref.close() that does not throw;
// this stand-in gives it both without changing SwipeableRow itself.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const { forwardRef, useImperativeHandle } = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  const MockSwipeable = forwardRef(
    (
      { children, renderRightActions }: { children?: ReactNode; renderRightActions?: () => ReactNode },
      ref: Ref<{ close: () => void }>,
    ) => {
      useImperativeHandle(ref, () => ({ close: () => {} }));
      return (
        <View>
          {children}
          {renderRightActions?.()}
        </View>
      );
    },
  );
  return { __esModule: true, default: MockSwipeable };
});

const mockShowToast = jest.fn();
jest.mock('@/components/display/toastStore', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

beforeEach(() => {
  mockShowToast.mockClear();
  mockUnsaveFood.mockClear();
});

const FIXTURE_FOOD = {
  id: 's1',
  name: 'Oats with whey',
  servingG: 250,
  calories: 320,
  protein: 28,
  carbs: 40,
  fat: 8,
};

test('renders a saved food row with its name', () => {
  (useSavedFoods as jest.Mock).mockReturnValue({
    data: [FIXTURE_FOOD],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  const tree = renderScreen(<SavedFoodsScreen />);
  const text = allText(tree);

  expect(text).toContain('My dishes');
  expect(text).toContain('Oats with whey');
});

test('shows the empty state when there are no saved foods', () => {
  (useSavedFoods as jest.Mock).mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  const tree = renderScreen(<SavedFoodsScreen />);
  expect(allText(tree)).toContain('No saved foods yet');
});

test('tapping the add button on a saved food logs it again and shows a confirmation toast', () => {
  (useSavedFoods as jest.Mock).mockReturnValue({
    data: [FIXTURE_FOOD],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  const tree = renderScreen(<SavedFoodsScreen />);
  const addButton = findAll(tree, (p) => p.accessibilityLabel === 'Add Oats with whey')[0];

  act(() => {
    (addButton.props.onPress as () => void)();
  });

  expect(mockShowToast).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Added Oats with whey.', tone: 'success' }),
  );
});

test('deleting a saved food removes it from the saved list', () => {
  (useSavedFoods as jest.Mock).mockReturnValue({
    data: [FIXTURE_FOOD],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  // SwipeableRow's revealed delete control confirms via Alert before calling
  // onDelete (global destructive rule) — simulate the user picking the
  // destructive option, same as a real confirm tap would.
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.style === 'destructive')?.onPress?.();
  });

  const tree = renderScreen(<SavedFoodsScreen />);
  const deleteButton = findAll(tree, (p) => p.accessibilityLabel === 'Unsave')[0];

  act(() => {
    (deleteButton.props.onPress as () => void)();
  });

  expect(mockUnsaveFood).toHaveBeenCalledWith('s1');

  alertSpy.mockRestore();
});
