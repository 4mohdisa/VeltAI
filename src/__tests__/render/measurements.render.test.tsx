// The "A few more details" screen — the one where Continue did nothing.
// These EXECUTE the screen; they are not source-text greps.
import MeasurementsScreen from '@/app/onboarding/measurements';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { renderScreen, buttonWithTitle, allText, findAll } from './helpers';

beforeEach(() => {
  useOnboardingStore.getState().reset();
});

test('SYMPTOM 2: Continue is not a dead control on an empty form', () => {
  const tree = renderScreen(<MeasurementsScreen />);
  const cont = buttonWithTitle(tree, 'Continue');
  expect(cont).toBeDefined();
  // A disabled button with no stated reason IS the bug: the user taps and
  // nothing happens, no message, no navigation.
  expect(cont!.props.disabled).toBeFalsy();
});

test('SYMPTOM 2: pressing Continue with an empty form states the specific reason per field', () => {
  const tree = renderScreen(<MeasurementsScreen />);
  // Nothing is shouted at an untouched form.
  expect(allText(tree)).not.toContain('Enter your age');

  TestPress(buttonWithTitle(tree, 'Continue')!);

  // The exact messages, next to the offending fields — not a generic toast,
  // and emphatically not silence.
  const text = allText(tree);
  expect(text).toContain('Enter your age');
  expect(text).toContain('Choose one so your targets are accurate');
});

test('ITEM 6: the age band matches the server exactly (13..120)', () => {
  const tree = renderScreen(<MeasurementsScreen />);
  const age = findAll(tree, (p) => p.label === 'Age')[0];
  const setAge = age.props.onChangeText as (t: string) => void;

  const { act } = require('./helpers') as { act: (cb: () => void) => void };
  act(() => setAge('12'));
  expect(allText(tree)).toContain('Enter an age between 13 and 120');

  act(() => setAge('121'));
  expect(allText(tree)).toContain('Enter an age between 13 and 120');

  // 100 was the old client ceiling — the server accepts it, so the client
  // must not invent a stricter rule and refuse input the API would take.
  act(() => setAge('105'));
  expect(allText(tree)).not.toContain('Enter an age between 13 and 120');
});

test('ITEM 3: sex starts unselected — no value is chosen for the user', () => {
  const tree = renderScreen(<MeasurementsScreen />);
  // The segmented control marks its chosen option accessibilityState.selected.
  const selected = findAll(tree, (p) => {
    const st = p.accessibilityState as { selected?: boolean } | undefined;
    const label = p.accessibilityLabel;
    return st?.selected === true && (label === 'Male' || label === 'Female' || label === 'Prefer not to say');
  });
  expect(selected).toHaveLength(0);
});

test('ITEM 4: the target-weight field follows the weight unit toggle', () => {
  useOnboardingStore.getState().setGoal('lose'); // target weight only shows for lose/muscle
  const tree = renderScreen(<MeasurementsScreen />);
  expect(allText(tree)).toContain('Target weight (kg)');

  const lb = findAll(tree, (p) => p.accessibilityLabel === 'lb')[0];
  expect(lb).toBeDefined();
  TestPress(lb);
  expect(allText(tree)).toContain('Target weight (lb)');
});

function TestPress(node: { props: Record<string, unknown> }): void {
  const onPress = node.props.onPress as (() => void) | undefined;
  expect(typeof onPress).toBe('function');
  const { act } = require('./helpers') as { act: (cb: () => void) => void };
  act(() => onPress!());
}
