// FloatingHeader — purely decorative top strip (no title, no controls: see its
// own header comment). PHASE2_ROWS.md FloatingHeader/navigation row: this mounts
// the real component and checks that Reduce Transparency swaps the translucent
// blur+gradient treatment for the opaque fallback View, not the other way round.
//
// Same mocking pattern as GlassButtons.reduceTransparency.render.test.tsx: the
// hook is mocked directly rather than relying on the OS setting, since this
// environment has no real Reduce Transparency state to read.
import { BlurView } from 'expo-blur';
import Svg from 'react-native-svg';

import { FLOATING_HEADER_HEIGHT, FloatingHeader } from '@/components/navigation/FloatingHeader';
import { useReduceTransparency } from '@/lib/design/reduceTransparency';
import { surface } from '@/lib/design/tokens';
import { findAll, renderScreen } from '../../__tests__/render/helpers';

jest.mock('@/lib/design/reduceTransparency', () => ({ useReduceTransparency: jest.fn(() => false) }));

const opaqueFallback = (tree: ReturnType<typeof renderScreen>) =>
  findAll(tree, (p) => {
    const style = ([] as unknown[]).concat(p.style ?? []);
    return style.some(
      (s) =>
        typeof s === 'object' &&
        s !== null &&
        (s as Record<string, unknown>).backgroundColor === surface.backgroundAlt &&
        (s as Record<string, unknown>).height === FLOATING_HEADER_HEIGHT,
    );
  });

test('Reduce Transparency on: the opaque fallback renders, not the blur/gradient treatment', () => {
  (useReduceTransparency as jest.Mock).mockReturnValue(true);
  const tree = renderScreen(<FloatingHeader />);
  expect(opaqueFallback(tree).length).toBeGreaterThan(0);
  expect(tree.root.findAllByType(BlurView)).toHaveLength(0);
  expect(tree.root.findAllByType(Svg)).toHaveLength(0);
});
