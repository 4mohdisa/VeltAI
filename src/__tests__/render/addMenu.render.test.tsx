// AddMenu — the tab bar's "+" popover (PHASE2_ROWS.md rows 38/53/83). The
// only prior mention was a comment in foodLogRowMotion.render.test.tsx, never
// an executed import. This EXECUTES the real component; it is not a
// source-text grep.
import { AddMenu } from '@/components/navigation/AddMenu';
import { allText, findAll, renderScreen } from './helpers';

test('shows both log rows and fires onLogFood when its row is pressed', () => {
  const onLogFood = jest.fn();
  const onLogGym = jest.fn();
  const onClose = jest.fn();

  const tree = renderScreen(
    <AddMenu
      visible
      onClose={onClose}
      anchorBottom={80}
      onLogGym={onLogGym}
      onLogFood={onLogFood}
      gymGlyph={null}
      foodGlyph={null}
    />,
  );

  const text = allText(tree);
  expect(text).toContain('Log gym session');
  expect(text).toContain('Log food');

  const foodRow = findAll(tree, (p) => p.accessibilityLabel === 'Log food')[0];
  (foodRow.props.onPress as () => void)();
  expect(onLogFood).toHaveBeenCalledTimes(1);
  expect(onLogGym).not.toHaveBeenCalled();
});
