// ProgressBar (PHASE2_ROWS.md "Progress rings, bars and number changes") — the
// fill used to snap straight to a changed value; it now eases to it over
// 250ms (EnergyBalanceCard's ring/net-number pattern: an Animated.Value plus a
// listener), unless Reduce Motion is on or this is the bar's own first paint.
import { StyleSheet } from 'react-native';

import { ProgressBar } from '@/components/display/ProgressBar';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

const fillWidth = (tree: ReturnType<typeof renderScreen>) =>
  StyleSheet.flatten(findAll(tree, (p) => p.accessibilityRole === 'progressbar')[0].props.children.props.style).width;

beforeEach(() => {
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

test('a bar mounting fresh shows its starting value immediately, no ease-in', () => {
  const tree = renderScreen(<ProgressBar value={0.4} />);
  expect(fillWidth(tree)).toBe('40%');
});

test('a changed value eases the fill toward it, not an instant snap', () => {
  jest.useFakeTimers();
  try {
    const tree = renderScreen(<ProgressBar value={0.2} />);
    expect(fillWidth(tree)).toBe('20%');

    act(() => {
      tree.update(<ProgressBar value={0.8} />);
    });
    // No time has passed yet: still the old width, not a jump to the new one.
    expect(fillWidth(tree)).toBe('20%');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(fillWidth(tree)).toBe('80%');
  } finally {
    jest.useRealTimers();
  }
});

test('Reduce Motion skips the ease and sets the new value immediately', () => {
  (useReduceMotion as jest.Mock).mockReturnValue(true);
  const tree = renderScreen(<ProgressBar value={0.2} />);
  expect(fillWidth(tree)).toBe('20%');

  act(() => {
    tree.update(<ProgressBar value={0.8} />);
  });
  // No fake-timer advance needed — Reduce Motion sets the value on the spot.
  expect(fillWidth(tree)).toBe('80%');
});

test('each re-render with a new value moves the fill and the reported progress to it', () => {
  jest.useFakeTimers();
  try {
    const tree = renderScreen(<ProgressBar value={0.2} />);
    const reported = () => findAll(tree, (p) => p.accessibilityRole === 'progressbar')[0].props.accessibilityValue.now;

    for (const [value, width, now] of [[0.8, '80%', 80], [0.5, '50%', 50]] as const) {
      act(() => {
        tree.update(<ProgressBar value={value} />);
      });
      expect(reported()).toBe(now);
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(fillWidth(tree)).toBe(width);
    }
  } finally {
    jest.useRealTimers();
  }
});
