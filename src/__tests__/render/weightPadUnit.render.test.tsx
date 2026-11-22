// PHASE3_ROWS.md row 15, units pass: the weight pad caption in PlannedValuesForm
// (src/components/gym/PlannedValuesForm.tsx) names the unit the form has chosen,
// lb or kg, instead of always "kg". Pure render, no network.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { NumberEntryBar } from '@/components/common/NumberEntryBar';
import { PlannedValuesForm } from '@/components/gym/PlannedValuesForm';
import en from '@/lib/i18n/locales/en.json';
import type { ExerciseLibraryItem } from '@/lib/types';
import type { WeightUnit } from '@/lib/units';
import { act, findAll, renderScreen } from './helpers';

// The number pad reads the safe-area insets, which a test renderer never measures.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const BENCH: ExerciseLibraryItem = {
  id: 'ex1',
  name: 'Bench press',
  muscle_group_primary: 'chest',
  muscle_groups_secondary: [],
  category: 'compound',
  exercise_type: 'strength',
  equipment: '',
  difficulty: '',
  description: '',
  met_value: 5,
};

function weightPadCaption(unit: WeightUnit): string {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PlannedValuesForm exercise={BENCH} initial={{ weight: 60, weight_unit: unit }} onSubmit={jest.fn()} />
    </SafeAreaProvider>,
  );
  const weightBox = en.food.tileEditLabel.replace('{{label}}', en.exercisePicker.targetWeight);
  act(() => {
    const box = findAll(tree, (p) => p.accessibilityLabel === weightBox && typeof p.onPress === 'function')[0];
    (box.props.onPress as () => void)();
  });
  return String(tree.root.findByType(NumberEntryBar).props.label);
}

test.each<[WeightUnit]>([['lb'], ['kg']])('with %s chosen, the weight pad caption names that unit', (unit) => {
  expect(weightPadCaption(unit)).toBe(`${en.exercisePicker.targetWeight} · ${unit}`);
});
