// Gym "My workouts" templates list (PHASE2_ROWS.md row 11, templates screen
// only) — no render test ever mounted this screen before; row 11's own notes
// trace every row-11 screen's wiring by reading source, not by executing it.
// This EXECUTES the real screen: src/app/gym/templates.tsx, whose only data
// hook is useTemplates() (@/lib/data/gymSchedule), which wraps api.gym.getTemplates().
// Mocked at that one module boundary, so the real hook runs.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TemplatesScreen from '@/app/gym/templates';
import { act, allText, findAll, renderScreen } from './helpers';

// The exercise-count line is built from several JSX expressions, so react-test-
// renderer gives it back as an array of text fragments (e.g. ["3", " exercise",
// "s", " · about 45 min"]), not one string — join a Text node's own children
// to compare it against the full line a user actually sees.
const fullLine = (p: Record<string, unknown>): string =>
  Array.isArray(p.children) ? (p.children as string[]).join('') : '';

const mockGetTemplates = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getTemplates: (...args: unknown[]) => mockGetTemplates(...args) } },
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

// Skeleton animates through reanimated's useReducedMotion, which this render
// environment does not provide (same gap noted in gymHistory.render.test.tsx)
// — it crashes the moment useTemplates()'s initial `loading: true` render hits
// it, before the fixture ever resolves. Neither test below is about the
// loading state, so a plain stand-in is enough.
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const renderWithInsets = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TemplatesScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  mockGetTemplates.mockReset();
});

test("renders each fixture template's name and exercise line", async () => {
  mockGetTemplates.mockResolvedValue([
    {
      id: 't1',
      user_id: 'u1',
      name: 'Push day',
      estimated_duration_minutes: 45,
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z',
      exercises: [{}, {}, {}],
    },
    {
      id: 't2',
      user_id: 'u1',
      name: 'Mobility',
      estimated_duration_minutes: null,
      created_at: '2026-11-02T00:00:00Z',
      updated_at: '2026-11-02T00:00:00Z',
      exercises: [{}],
    },
  ]);

  const tree = renderWithInsets();
  await settle();

  const text = allText(tree);
  expect(text).toContain('Push day');
  expect(text).toContain('Mobility');
  expect(findAll(tree, (p) => fullLine(p) === '3 exercises · about 45 min').length).toBeGreaterThan(0);
  expect(findAll(tree, (p) => fullLine(p) === '1 exercise').length).toBeGreaterThan(0);
});

test('renders the empty state when there are no templates', async () => {
  mockGetTemplates.mockResolvedValue([]);

  const tree = renderWithInsets();
  await settle();

  const text = allText(tree);
  expect(text).toContain('No workouts yet');
  expect(text).toContain('Create a workout template to build your weekly schedule.');
});
