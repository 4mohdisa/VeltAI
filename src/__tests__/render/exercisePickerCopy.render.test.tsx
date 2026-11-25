// PHASE3_ROWS.md row 17, ExercisePicker (src/components/gym/ExercisePicker.tsx):
// the sheet title, search field, muscle pills and "No exercises found" read
// from the locale file. useExercises is mocked at its module boundary with an
// empty library, so the no-results text shows and no network is called.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ExercisePicker } from '@/components/gym/ExercisePicker';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({
  useExercises: () => ({ exercises: [], loading: false }),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

// The FlatList in the tree holds a circular prop, so allText cannot serialise
// it; collect the rendered strings (text children and placeholders) instead.
async function renderText(lng: string): Promise<string[]> {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ExercisePicker visible onClose={jest.fn()} onPick={jest.fn()} />
    </SafeAreaProvider>,
  );
  return findAll(tree, (p) => typeof p.children === 'string' || typeof p.placeholder === 'string').map((n) =>
    String(typeof n.props.children === 'string' ? n.props.children : n.props.placeholder),
  );
}

const copy = (l: Locale) => [l.exercisePicker.title, l.exercisePicker.noResults, l.exercisePicker.pillChest, l.exercisePicker.searchPlaceholder];

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: the title, pills, search field and no-results text read from en.json', async () => {
  const text = await renderText('en');
  for (const s of copy(en)) expect(text).toContain(s);
});

test('Spanish: the same copy reads from es.json and no English is left', async () => {
  const text = await renderText('es');
  for (const s of copy(es)) expect(text).toContain(s);
  for (const s of copy(en)) expect(text).not.toContain(s);
});
