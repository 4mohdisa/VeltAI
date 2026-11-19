// DailyMacroRing (PHASE2_ROWS.md "Progress rings, bars and number changes") —
// the ring and its centre number used to snap straight to a changed value;
// they now ease to it over 250ms (ProgressBar.tsx / EnergyBalanceCard.tsx's
// pattern: an Animated.Value plus a listener), unless Reduce Motion is on or
// this is the ring's own first paint.
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

// The SVG ring's strokeDashoffset is an Animated node, not a plain number, on
// the live fiber — read it back from the rendered (resolved) JSON tree instead.
const dashoffsetOf = (tree: ReturnType<typeof renderScreen>): number => {
  const match = allText(tree).match(/"strokeDashoffset":([\d.]+)/);
  if (!match) throw new Error('no strokeDashoffset found');
  return Number(match[1]);
};
// The centre number specifically — the accessibilityLabel (unlike this Text
// node) always reads the real, final `consumed` prop, by design, so it isn't
// a safe stand-in for "what the ring currently shows".
const centreNumberOf = (tree: ReturnType<typeof renderScreen>) =>
  findAll(tree, (p) => p.variant === 'statMedium')[0].props.children;

// Default size 168, strokeWidth 14 -> radius 77.
const CIRCUMFERENCE = 2 * Math.PI * 77;
const offsetFor = (pct: number) => CIRCUMFERENCE * (1 - pct);

beforeEach(() => {
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

test('a ring mounting fresh shows its starting value immediately, no ease-in', () => {
  const tree = renderScreen(<DailyMacroRing consumed={400} target={2000} />);
  expect(centreNumberOf(tree)).toBe('400');
  expect(dashoffsetOf(tree)).toBeCloseTo(offsetFor(0.2), 5);
});

test('a changed value eases the ring and the centre number toward it, not an instant snap', () => {
  jest.useFakeTimers();
  try {
    const tree = renderScreen(<DailyMacroRing consumed={400} target={2000} />);
    expect(centreNumberOf(tree)).toBe('400');

    act(() => {
      tree.update(<DailyMacroRing consumed={1600} target={2000} />);
    });
    // No time has passed yet: still the old number, not a jump to the new one.
    expect(centreNumberOf(tree)).toBe('400');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(centreNumberOf(tree)).toBe('1,600');
    expect(dashoffsetOf(tree)).toBeCloseTo(offsetFor(0.8), 5);
  } finally {
    jest.useRealTimers();
  }
});

test('Reduce Motion skips the ease and sets the new value immediately', () => {
  (useReduceMotion as jest.Mock).mockReturnValue(true);
  const tree = renderScreen(<DailyMacroRing consumed={400} target={2000} />);
  expect(centreNumberOf(tree)).toBe('400');

  act(() => {
    tree.update(<DailyMacroRing consumed={1600} target={2000} />);
  });
  // No fake-timer advance needed — Reduce Motion sets the value on the spot.
  expect(centreNumberOf(tree)).toBe('1,600');
});
