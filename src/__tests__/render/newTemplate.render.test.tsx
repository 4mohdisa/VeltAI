// Gym "New/Edit workout" template builder (PHASE2_ROWS.md row 11, new-template
// screen only) — no render test ever mounted this screen before. This
// EXECUTES the real screen: src/app/gym/new-template.tsx, whose only data
// calls are api.gym.getTemplate (edit-mode prefill), api.gym.createTemplate
// and api.gym.updateTemplate (save). Mocked at that one module boundary, so
// the real component's state and save() logic run.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NewTemplateScreen from '@/app/gym/new-template';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

const mockGetTemplate = jest.fn();
const mockCreateTemplate = jest.fn();
const mockUpdateTemplate = jest.fn();
// ExercisePicker (mounted but not visible until "Add an exercise" is pressed)
// reads the exercise library unconditionally via useExercises(), so that call
// needs a fixture too even though neither test opens the picker.
const mockGetExercises = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: {
      getTemplate: (...args: unknown[]) => mockGetTemplate(...args),
      createTemplate: (...args: unknown[]) => mockCreateTemplate(...args),
      updateTemplate: (...args: unknown[]) => mockUpdateTemplate(...args),
      getExercises: (...args: unknown[]) => mockGetExercises(...args),
    },
  },
}));

// This screen is the first render test to need a route param (`id`, for edit
// mode) — the shared expo-router mock (render/setup.ts) always answers
// useLocalSearchParams with `{}`, so it's overridden here with a jest.fn()
// each test can set, keeping router.push/replace/back the same kind of spy
// the shared mock uses.
const mockParams = jest.fn((): { id?: string } => ({}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams(),
  usePathname: () => '/gym/new-template',
  Href: {},
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const renderWithInsets = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NewTemplateScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  mockParams.mockReturnValue({});
  mockGetTemplate.mockReset();
  mockCreateTemplate.mockReset();
  mockUpdateTemplate.mockReset();
  mockGetExercises.mockReset();
  mockGetExercises.mockResolvedValue([]);
});

test('renders the name and duration fields, and the empty-exercises state', async () => {
  const tree = renderWithInsets();
  await settle(); // flushes ExercisePicker's own (invisible) useExercises() read

  const text = allText(tree);
  expect(text).toContain('New workout');
  expect(text).toContain('Name');
  expect(text).toContain('Duration (min, optional)');
  expect(text).toContain('Add exercises to build your workout.');
  expect(buttonWithTitle(tree, 'Save workout')).toBeDefined();
});

test('editing a template and saving calls updateTemplate with the edited name and duration', async () => {
  mockParams.mockReturnValue({ id: 't1' });
  mockGetTemplate.mockResolvedValue({
    id: 't1',
    user_id: 'u1',
    name: 'Push day',
    estimated_duration_minutes: 45,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    exercises: [],
  });
  mockUpdateTemplate.mockResolvedValue({});

  const tree = renderWithInsets();
  await settle();

  expect(allText(tree)).toContain('Edit workout');

  await act(async () => {
    (buttonWithTitle(tree, 'Save workout')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockUpdateTemplate).toHaveBeenCalledWith('t1', { name: 'Push day', estimated_duration_minutes: 45 });
  expect(mockCreateTemplate).not.toHaveBeenCalled();
});
