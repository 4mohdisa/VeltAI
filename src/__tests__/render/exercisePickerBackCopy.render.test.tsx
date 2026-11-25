// PHASE3_ROWS.md row 17, ExercisePicker planned-values step
// (src/components/gym/ExercisePicker.tsx): the back control's visible text and
// its accessibility label read from the locale file. useExercises is mocked at
// its module boundary with one fixture exercise (the step needs a row to tap),
// so no network is called. Rendered strings are collected directly, as in
// exercisePickerCopy.render.test.tsx, because allText cannot serialise the list.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ExercisePicker } from '@/components/gym/ExercisePicker';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import type { ExerciseLibraryItem } from '@/lib/types';
import { act, findAll, renderScreen } from './helpers';

const mockExercise: ExerciseLibraryItem = {
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

jest.mock('@/lib/data/gymSchedule', () => ({
  useExercises: () => ({ exercises: [mockExercise], loading: false }),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

async function openPlannedStep(lng: string) {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ExercisePicker visible onClose={jest.fn()} onPick={jest.fn()} />
    </SafeAreaProvider>,
  );
  act(() => {
    const row = findAll(tree, (p) => p.accessibilityLabel === mockExercise.name && typeof p.onPress === 'function')[0];
    (row.props.onPress as () => void)();
  });
  const texts = findAll(tree, (p) => typeof p.children === 'string').map((n) => String(n.props.children));
  const labels = findAll(tree, (p) => typeof p.accessibilityLabel === 'string' && typeof p.onPress === 'function').map((n) =>
    String(n.props.accessibilityLabel),
  );
  return { texts, labels };
}

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

const expectBack = (got: { texts: string[]; labels: string[] }, l: Locale) => {
  expect(got.texts).toContain(l.exercisePicker.back);
  expect(got.labels).toContain(l.exercisePicker.backLabel);
};

test('English: the back control text and label read from en.json', async () => {
  expectBack(await openPlannedStep('en'), en);
});

test('Spanish: the back control text and label read from es.json and no English is left', async () => {
  const got = await openPlannedStep('es');
  expectBack(got, es);
  expect(got.texts).not.toContain(en.exercisePicker.back);
  expect(got.labels).not.toContain(en.exercisePicker.backLabel);
});
