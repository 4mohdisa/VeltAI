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

test('ITEM 4: flipping kg<->lb CONVERTS the typed value instead of reinterpreting it', () => {
  const tree = renderScreen(<MeasurementsScreen />);
  const weight = findAll(tree, (p) => p.accessibilityLabel === 'Current weight in kilograms')[0];
  const { act } = require('./helpers') as { act: (cb: () => void) => void };
  act(() => (weight.props.onChangeText as (t: string) => void)('70'));

  // Flip to lb: 70 kg is 154.3 lb, NOT "70 lb" (which would silently restate
  // the user's weight as 31.8 kg and feed that into BMR).
  TestPress(findAll(tree, (p) => p.accessibilityLabel === 'lb')[0]);
  const lbField = findAll(tree, (p) => p.accessibilityLabel === 'Current weight in pounds')[0];
  expect(parseFloat(lbField.props.value as string)).toBeCloseTo(154.3, 1);

  // And back again — the round trip returns the original.
  TestPress(findAll(tree, (p) => p.accessibilityLabel === 'kg')[0]);
  const kgField = findAll(tree, (p) => p.accessibilityLabel === 'Current weight in kilograms')[0];
  expect(parseFloat(kgField.props.value as string)).toBeCloseTo(70, 1);
});

test('ITEM 4: flipping cm<->ft/in carries the height across', () => {
  const tree = renderScreen(<MeasurementsScreen />);
  const cm = findAll(tree, (p) => p.accessibilityLabel === 'Height in centimetres')[0];
  const { act } = require('./helpers') as { act: (cb: () => void) => void };
  act(() => (cm.props.onChangeText as (t: string) => void)('180'));

  TestPress(findAll(tree, (p) => p.accessibilityLabel === 'ft / in')[0]);
  const feet = findAll(tree, (p) => p.accessibilityLabel === 'Height, feet')[0];
  const inches = findAll(tree, (p) => p.accessibilityLabel === 'Height, inches')[0];
  // 180 cm = 70.9 in = 5 ft 11 in — not two empty boxes.
  expect(feet.props.value).toBe('5');
  expect(inches.props.value).toBe('11');
});

function TestPress(node: { props: Record<string, unknown> }): void {
  const onPress = node.props.onPress as (() => void) | undefined;
  expect(typeof onPress).toBe('function');
  const { act } = require('./helpers') as { act: (cb: () => void) => void };
  act(() => onPress!());
}
