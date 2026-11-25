// PHASE3_ROWS.md row 17, PlannedValuesForm (src/components/gym/PlannedValuesForm.tsx),
// the planned-values step of the exercise picker and the session screen: field
// labels, unit words, the number-pad caption and the Add exercise button read
// from the locale file in en, es and fr. Pure render, no network.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { PlannedValuesForm } from '@/components/gym/PlannedValuesForm';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import type { ExerciseLibraryItem } from '@/lib/types';
import { act, findAll, renderScreen } from './helpers';

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

// The number pad reads the safe-area insets, which a test renderer never measures.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const exercise = (exercise_type: string): ExerciseLibraryItem => ({
  id: 'ex1',
  name: 'Bench press',
  muscle_group_primary: 'chest',
  muscle_groups_secondary: [],
  category: 'compound',
  exercise_type,
  equipment: '',
  difficulty: '',
  description: '',
  met_value: 5,
});

// Text children plus the props that carry copy (field labels, button titles).
async function renderStrings(lng: string, type: string, openSetsPad = false): Promise<string[]> {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PlannedValuesForm exercise={exercise(type)} onSubmit={jest.fn()} />
    </SafeAreaProvider>,
  );
  if (openSetsPad) {
    act(() => {
      const box = findAll(tree, (p) => typeof p.onPress === 'function' && typeof p.accessibilityLabel === 'string')[0];
      (box.props.onPress as () => void)();
    });
  }
  return findAll(tree, (p) => typeof p.children === 'string' || typeof p.label === 'string' || typeof p.title === 'string').map(
    (n) => String(typeof n.props.children === 'string' ? n.props.children : (n.props.label ?? n.props.title)),
  );
}

const strength = (l: Locale) => [
  l.exercisePicker.plannedSets,
  l.exercisePicker.targetReps,
  l.exercisePicker.targetWeight,
  l.exercisePicker.unit,
  l.gym.rest,
  l.exercisePicker.unitSets,
  l.gymSession.unitReps,
  l.exercisePicker.unitSec,
  l.exercisePicker.addExercise,
];

// Every English string from the form. Spanish keeps the gym-wide unit word
// "reps" (gymSession.unitReps), so that one is not expected to change there.
const english = [...strength(en), en.exercisePicker.durationMin, en.exercisePicker.padWeight, en.exercisePicker.padRest];

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: strength labels, units, sets pad caption and Add exercise read from the locale file', async (lng, locale) => {
  const strings = await renderStrings(lng, 'strength');
  for (const s of strength(locale)) expect(strings).toContain(s);
  const withPad = await renderStrings(lng, 'strength', true);
  expect(withPad).toContain(locale.exercisePicker.plannedSets);
  if (lng !== 'en') {
    const all = [...strings, ...withPad, ...(await renderStrings(lng, 'cardio'))];
    for (const s of english) {
      if (s === locale.gymSession.unitReps) continue;
      expect(all).not.toContain(s);
    }
  }
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: cardio shows the duration field from the locale file', async (lng, locale) => {
  expect(await renderStrings(lng, 'cardio')).toContain(locale.exercisePicker.durationMin);
});
