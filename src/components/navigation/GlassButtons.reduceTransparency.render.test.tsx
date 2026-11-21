// GlassButtons — the three-way material ladder (real Liquid Glass → BlurView
// → opaque under Reduce Transparency) shared by every glass nav control.
// PHASE2_ROWS.md row 32: this mounts a real glass button and checks that
// Reduce Transparency actually swaps in the solid fallback instead of GlassView
// or BlurView, and that turning it off takes the Liquid Glass branch.
//
// isLiquidGlassAvailable() returns false outside a real iOS build (its default,
// non-platform-specific implementation), so without this mock the GlassView
// branch could never be reached in this environment regardless of Reduce
// Transparency — the LIQUID check runs before Reduce Transparency is even read.
import { GlassView } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

import { GlassCloseButton } from '@/components/navigation/GlassButtons';
import { useReduceTransparency } from '@/lib/design/reduceTransparency';
import { color, surface } from '@/lib/design/tokens';
import { findAll, renderScreen } from '../../__tests__/render/helpers';

jest.mock('expo-glass-effect', () => ({
  ...jest.requireActual('expo-glass-effect'),
  isLiquidGlassAvailable: () => true,
}));

jest.mock('@/lib/design/reduceTransparency', () => ({ useReduceTransparency: jest.fn(() => false) }));

const solidFallback = (tree: ReturnType<typeof renderScreen>) =>
  findAll(tree, (p) => {
    const style = ([] as unknown[]).concat(p.style ?? []);
    return style.some(
      (s) => typeof s === 'object' && s !== null && (s as Record<string, unknown>).backgroundColor === surface.card,
    ) && style.some((s) => typeof s === 'object' && s !== null && (s as Record<string, unknown>).borderColor === color.gray200);
  });

test('Reduce Transparency on: the solid fallback renders, not GlassView or BlurView', () => {
  (useReduceTransparency as jest.Mock).mockReturnValue(true);
  const tree = renderScreen(<GlassCloseButton />);
  expect(solidFallback(tree).length).toBeGreaterThan(0);
  expect(tree.root.findAllByType(GlassView)).toHaveLength(0);
  expect(tree.root.findAllByType(BlurView)).toHaveLength(0);
});

test('Reduce Transparency off: GlassView renders', () => {
  (useReduceTransparency as jest.Mock).mockReturnValue(false);
  const tree = renderScreen(<GlassCloseButton />);
  expect(tree.root.findAllByType(GlassView).length).toBeGreaterThan(0);
});
