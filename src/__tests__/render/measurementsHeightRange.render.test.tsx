// Measurements step, ft/in height: inches must be 0 to 11 and their error shows
// under the inches box; the overall height range error shows under feet. An
// invalid height blocks Continue. EXECUTES the screen.
import MeasurementsScreen from '@/app/onboarding/measurements';
import { router } from 'expo-router';
import en from '@/lib/i18n/locales/en.json';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, buttonWithTitle, findAll, renderScreen, screenTitle } from './helpers';

const m = en.onboarding.measurements;
const IN_RANGE = m.heightRangeIn.replace('{{min}}', '0').replace('{{max}}', '11');
const FT_RANGE = m.heightRangeFt.replace('{{min}}', '3').replace('{{max}}', '8');

// Every other field is valid, so only the height decides Continue.
beforeEach(() => {
  useOnboardingStore.getState().reset();
  useOnboardingStore.getState().setMeasurements({ age: 30, sex: 'female', weight_kg: 70, height_unit: 'ftin' });
});

function render(feet: string, inches: string) {
  const tree = renderScreen(<MeasurementsScreen />);
  const field = (label: string) =>
    findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onChangeText === 'function')[0];
  act(() => (field(m.heightFeetA11y).props.onChangeText as (t: string) => void)(feet));
  act(() => (field(m.heightInchesA11y).props.onChangeText as (t: string) => void)(inches));
  act(() => (buttonWithTitle(tree, m.continue)!.props.onPress as () => void)());
  return {
    tree,
    feetError: field(m.heightFeetA11y).props.error,
    inchesError: field(m.heightInchesA11y).props.error,
  };
}

test('5 ft 15 in shows the inches error under inches and does not continue', () => {
  const { tree, feetError, inchesError } = render('5', '15');
  expect(screenTitle(tree)).toBe(m.title);
  expect(inchesError).toBe(IN_RANGE);
  expect(feetError).toBeUndefined();
  expect(router.push).not.toHaveBeenCalled();
});

test('5 ft 11 in is accepted', () => {
  const { feetError, inchesError } = render('5', '11');
  expect(feetError).toBeUndefined();
  expect(inchesError).toBeUndefined();
  expect(router.push).toHaveBeenCalledWith('/onboarding/body-type');
  expect(useOnboardingStore.getState().height_cm).toBe(180);
});

test('9 ft 0 in shows the height range error under feet and does not continue', () => {
  const { feetError, inchesError } = render('9', '0');
  expect(feetError).toBe(FT_RANGE);
  expect(inchesError).toBeUndefined();
  expect(router.push).not.toHaveBeenCalled();
});
