// PHASE3_ROWS.md row 14, Gym muscle focus (src/app/gym/muscles.tsx) states.
// useGymPatterns is mocked, the same way gymMuscles.shape.render.test.tsx does,
// so each state is instant. A failed read shows the LoadFailedNotice, not the
// empty state; a successful read with no volume shows the empty state; the copy
// is read from en.json, and every gymMuscles key exists in en, es and fr.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MuscleFocusScreen from '@/app/gym/muscles';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { findAll, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({ useGymPatterns: jest.fn() }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const mockPatterns = (state: { patterns: unknown; isError: boolean }) => {
  (useGymPatterns as jest.Mock).mockReturnValue({ ...state, loading: false });
};

const renderMuscles = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MuscleFocusScreen />
    </SafeAreaProvider>,
  );

type Tree = ReturnType<typeof renderMuscles>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

test('a failed read shows the load failure, not the empty state', () => {
  mockPatterns({ patterns: null, isError: true });
  const tree = renderMuscles();

  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.gymMuscles.emptyTitle)).toBe(false);
  expect(hasText(tree, en.gymMuscles.title)).toBe(true);
});

test('the failed-read notice offers Try again, wired to the useGymPatterns refetch', () => {
  (useGymPatterns as jest.Mock).mockReturnValue({ patterns: null, isError: true, loading: false, refetch: jest.fn() });
  const tree = renderMuscles();

  // findAll sees the Pressable and its host view, so check presence, not a count.
  expect(findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain).length).toBeGreaterThan(0);
});

test('a successful read with no volume shows the empty state from en.json', () => {
  mockPatterns({ patterns: { muscle_volume_map: {} }, isError: false });
  const tree = renderMuscles();

  expect(hasText(tree, en.gymMuscles.emptyTitle)).toBe(true);
  expect(hasText(tree, en.gymMuscles.emptyMessage)).toBe(true);
  expect(hasText(tree, en.gym.loadFailed)).toBe(false);
});

test('every gymMuscles key exists in en, es and fr', () => {
  const keys = Object.keys(en.gymMuscles).sort();
  expect(Object.keys(es.gymMuscles).sort()).toEqual(keys);
  expect(Object.keys(fr.gymMuscles).sort()).toEqual(keys);
});
