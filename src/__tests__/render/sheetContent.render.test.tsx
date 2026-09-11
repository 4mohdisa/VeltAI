// V1 — the design's sheet header, as an opt-in variant of SheetContent.
// The standard variant is pinned unchanged (the parked gym/freeze sheet keeps
// it); the leading variant is pinned to the design's values.
import { StyleSheet, Text as RNText } from 'react-native';

import {
  SheetContent,
  SHEET_CLOSE_GLYPH,
  SHEET_CLOSE_SIZE,
  SHEET_HEADER_GAP,
} from '@/components/navigation/SheetContent';
import { color } from '@/lib/design/tokens';
import { allText, findAll, renderScreen } from './helpers';

const closeOf = (tree: ReturnType<typeof renderScreen>) => findAll(tree, (p) => p.accessibilityLabel === 'Close')[0];
const hasDone = (tree: ReturnType<typeof renderScreen>) =>
  findAll(tree, (p) => typeof p.accessibilityLabel === 'string' && /done|save/i.test(p.accessibilityLabel as string)).length > 0;

test('the design values are pinned', () => {
  expect([SHEET_CLOSE_SIZE, SHEET_CLOSE_GLYPH, SHEET_HEADER_GAP]).toEqual([40, 15, 10]);
});

test('leading: title on the left with its subtitle, a 40pt light-1 close on the right, no header save', () => {
  const tree = renderScreen(
    <SheetContent variant="leading" title="Pick a day" subtitle="Dots mark days with food logged" onClose={() => {}} onDone={() => {}}>
      <RNText>body</RNText>
    </SheetContent>,
  );
  const text = allText(tree);
  expect(text).toContain('Pick a day');
  expect(text).toContain('Dots mark days with food logged');
  // The title comes before the close control in the tree: title left, × right.
  expect(text.indexOf('Pick a day')).toBeLessThan(text.indexOf('"Close"'));

  const close = closeOf(tree);
  const style = StyleSheet.flatten(
    typeof close.props.style === 'function' ? close.props.style({ pressed: false }) : close.props.style,
  );
  expect(style).toMatchObject({ width: SHEET_CLOSE_SIZE, height: SHEET_CLOSE_SIZE, backgroundColor: color.light1 });
  // Saving is the screen's bottom pill in this variant; the header never grows a tick.
  expect(hasDone(tree)).toBe(false);
});

test('standard (default) is unchanged: close leading, the tick trailing when onDone is given', () => {
  const tree = renderScreen(
    <SheetContent title="Streak freeze" onClose={() => {}} onDone={() => {}}>
      <RNText>body</RNText>
    </SheetContent>,
  );
  expect(allText(tree)).toContain('Streak freeze');
  expect(closeOf(tree)).toBeDefined();
  expect(hasDone(tree)).toBe(true);
});
