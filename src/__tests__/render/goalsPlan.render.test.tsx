// Row 2b: goal and activity level on the Goals screen (src/app/profile/goals.tsx).
// A change recomputes the targets with deriveGoals and saves them with
// PUT /api/goals (savePlan); the stores change only once the save succeeds.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GoalsScreen from '@/app/profile/goals';
import { useToastStore } from '@/components/display/toastStore';
import { useUserStore } from '@/lib/data/userStore';
import { deriveGoals } from '@/lib/goals/derive';
import en from '@/lib/i18n/locales/en.json';
import { useSettingsStore } from '@/lib/settings/store';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const ONBOARDING = { completed: true, age: 30, sex: 'male', height: 178, height_unit: 'cm', weight: 82, weight_unit: 'kg', activity_level: 'moderate', goal: 'lose' };
const GOALS_ROW = {
  id: 'g1', user_id: 'u1', calorie_target: 2222, protein_target: 150, carb_target: 220, fat_target: 70, fibre_target: 30,
  weight_goal: 'lose', target_weight: null, weight_unit: 'kg', activity_level: 'moderate', source: 'onboarding',
};
const PROFILE_ROW = { id: 'u1', display_name: 'Test', email: 'test@example.com', avatar_url: null };

type Init = { method?: string; body?: string };
const json = (data: unknown, status = 200) =>
  Promise.resolve({ ok: status < 300, status, json: async () => ({ data, error: status < 300 ? null : 'error' }) });

let putBodies: Record<string, unknown>[];
const mockFetch = (putStatus: number, goalsRow: Record<string, unknown> = GOALS_ROW) =>
  jest.fn((url: string, init?: Init) => {
    if (url.includes('/api/goals') && init?.method === 'PUT') {
      const body = JSON.parse(init.body ?? '{}') as Record<string, unknown>;
      putBodies.push(body);
      return putStatus < 300 ? json({ ...goalsRow, ...body }) : json(null, putStatus);
    }
    if (url.includes('/api/goals')) return json(goalsRow);
    if (url.includes('/api/onboarding')) return json(ONBOARDING);
    if (url.includes('/api/profile')) return json(PROFILE_ROW);
    return json({});
  });

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const render = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GoalsScreen />
    </SafeAreaProvider>,
  );

const option = (tree: ReturnType<typeof render>, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function')[0];

const press = async (tree: ReturnType<typeof render>, label: string) => {
  await act(async () => {
    (option(tree, label).props.onPress as () => void)();
  });
  await settle();
  await settle();
};

// The loading test holds its reads open. Each one is answered at teardown, so
// the API client's deadline timer is cleared before the worker exits.
const held: (() => void)[] = [];
const holdFetch = () =>
  jest.fn((url: string, init?: Init) => new Promise((resolve) => held.push(() => resolve(mockFetch(200)(url, init)))));

afterEach(async () => {
  held.splice(0).forEach((answer) => answer());
  await settle();
});

beforeEach(() => {
  putBodies = [];
  useSettingsStore.getState().reset();
  useUserStore.getState().resetProfile();
  useToastStore.getState().dismiss();
  useOnboardingStore.getState().reset();
});

test('loading: the goal and activity rows are disabled until the goals read lands', () => {
  (globalThis as unknown as { fetch: unknown }).fetch = holdFetch();
  const tree = render();
  expect(option(tree, en.goals.plan.goalOptions.muscle).props.disabled).toBe(true);
  expect(option(tree, en.goals.plan.activityOptions.light).props.disabled).toBe(true);
});

test('the rows show the saved goal and activity level from the goals row', async () => {
  (globalThis as unknown as { fetch: unknown }).fetch = mockFetch(200);
  const tree = render();
  await settle();
  await settle();

  expect(option(tree, en.goals.plan.goalOptions.lose).props.accessibilityState).toEqual({ selected: true });
  expect(option(tree, en.goals.plan.activityOptions.moderate).props.accessibilityState).toEqual({ selected: true });
  expect(option(tree, en.goals.plan.goalOptions.muscle).props.disabled).toBe(false);
});

test('saved: choosing Gain saves recomputed targets and shows the saved toast', async () => {
  (globalThis as unknown as { fetch: unknown }).fetch = mockFetch(200);
  const tree = render();
  await settle();
  await settle();

  await press(tree, en.goals.plan.goalOptions.muscle);

  const expected = deriveGoals({ ...useUserStore.getState().profile, goal: 'muscle' });
  expect(putBodies).toHaveLength(1);
  expect(putBodies[0]).toMatchObject({
    weight_goal: 'muscle',
    activity_level: 'moderate',
    calorie_target: expected.calories,
    protein_target: expected.protein,
  });
  expect(useUserStore.getState().profile.goal).toBe('muscle');
  expect(useSettingsStore.getState().serverGoals?.calories).toBe(expected.calories);
  expect(useToastStore.getState().current?.message).toBe(en.goals.plan.saved);
  expect(option(tree, en.goals.plan.goalOptions.muscle).props.accessibilityState).toEqual({ selected: true });
});

test('saved: choosing an activity level saves it with the current goal', async () => {
  (globalThis as unknown as { fetch: unknown }).fetch = mockFetch(200);
  const tree = render();
  await settle();
  await settle();

  await press(tree, en.goals.plan.activityOptions.very_active);

  expect(putBodies[0]).toMatchObject({ weight_goal: 'lose', activity_level: 'very_active' });
  expect(useUserStore.getState().profile.activityLevel).toBe('very_active');
});

test('error: a failed save keeps the old plan and shows the error toast', async () => {
  (globalThis as unknown as { fetch: unknown }).fetch = mockFetch(500);
  const tree = render();
  await settle();
  await settle();

  await press(tree, en.goals.plan.goalOptions.muscle);

  expect(putBodies).toHaveLength(1);
  expect(useUserStore.getState().profile.goal).toBe('lose');
  expect(useToastStore.getState().current?.message).toBe(en.goals.plan.saveFailed);
  expect(option(tree, en.goals.plan.goalOptions.lose).props.accessibilityState).toEqual({ selected: true });
  expect(option(tree, en.goals.plan.goalOptions.muscle).props.disabled).toBe(false);
});

describe('a stored eat healthier goal', () => {
  const EAT_HEALTHIER_ROW = { ...GOALS_ROW, weight_goal: 'eat_healthier' };

  test('shows as selected', async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = mockFetch(200, EAT_HEALTHIER_ROW);
    const tree = render();
    await settle();
    await settle();

    expect(option(tree, en.goals.plan.goalEatHealthier).props.accessibilityState).toEqual({ selected: true });
    expect(option(tree, en.goals.plan.goalOptions.track).props.accessibilityState).toEqual({ selected: false });
  });

  test('changing only the activity level sends the stored goal unchanged', async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = mockFetch(200, EAT_HEALTHIER_ROW);
    const tree = render();
    await settle();
    await settle();

    await press(tree, en.goals.plan.activityOptions.light);

    expect(putBodies).toHaveLength(1);
    expect(putBodies[0]).toMatchObject({ weight_goal: 'eat_healthier', activity_level: 'light' });
    expect(option(tree, en.goals.plan.goalEatHealthier).props.accessibilityState).toEqual({ selected: true });
  });

  test('changing the Goal row sends the chosen value', async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = mockFetch(200, EAT_HEALTHIER_ROW);
    const tree = render();
    await settle();
    await settle();

    await press(tree, en.goals.plan.goalOptions.track);

    expect(putBodies[0]).toMatchObject({ weight_goal: 'track', activity_level: 'moderate' });
    expect(option(tree, en.goals.plan.goalOptions.track).props.accessibilityState).toEqual({ selected: true });
  });
});

describe('training days', () => {
  const days = en.onboarding.trainingDays.options;

  test('shows the stored value', async () => {
    useOnboardingStore.getState().setTrainingDays('days_1_2');
    (globalThis as unknown as { fetch: unknown }).fetch = mockFetch(200);
    const tree = render();
    await settle();

    expect(option(tree, days.days_1_2).props.accessibilityState).toEqual({ selected: true });
    expect(option(tree, days.days_3_4).props.accessibilityState).toEqual({ selected: false });
  });

  test('a change is saved locally and leaves the plan, activity level and targets alone', async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = mockFetch(200);
    const tree = render();
    await settle();
    await settle();
    const before = {
      goal: useUserStore.getState().profile.goal,
      activityLevel: useUserStore.getState().profile.activityLevel,
      serverGoals: useSettingsStore.getState().serverGoals,
    };

    await press(tree, days.days_5_plus);

    expect(useOnboardingStore.getState().training_days).toBe('days_5_plus');
    expect(option(tree, days.days_5_plus).props.accessibilityState).toEqual({ selected: true });
    expect(useToastStore.getState().current?.message).toBe(en.goals.plan.trainingDaysSaved);
    expect(putBodies).toHaveLength(0);
    expect({
      goal: useUserStore.getState().profile.goal,
      activityLevel: useUserStore.getState().profile.activityLevel,
      serverGoals: useSettingsStore.getState().serverGoals,
    }).toEqual(before);
  });
});
