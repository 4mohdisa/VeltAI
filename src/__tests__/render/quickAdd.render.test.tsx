// Food "Quick add" screen (PHASE2_ROWS.md row 5 "Quick add") — no render test
// existed for this screen before. This EXECUTES the real screen; it is not a
// source-text grep. No data hook runs on mount (api.foodLogs.quickAdd only
// fires from the Add button's press handler), so no mock is needed here.
import QuickAddScreen from '@/app/food/quick-add';
import { allText, renderScreen } from './helpers';

test('renders the Quick add sheet title', () => {
  const tree = renderScreen(<QuickAddScreen />);
  expect(allText(tree)).toContain('Quick add');
});

test('starts on the kcal hero figure with its tap-to-type hint, not the number pad', () => {
  const tree = renderScreen(<QuickAddScreen />);
  const text = allText(tree);
  expect(text).toContain('kcal · tap to type');
  expect(text).toContain('250');
});
