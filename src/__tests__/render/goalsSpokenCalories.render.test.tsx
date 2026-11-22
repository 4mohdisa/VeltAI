// Goals calorie field spoken unit (PHASE3_ROWS.md row 15). VoiceOver reads the
// unit as a word when the unit is kcal (goals.caloriesSpoken) and keeps the kJ
// abbreviation when the unit is kJ, since "calories" would misname a kJ figure.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/lib/settings/store';
import { useUserStore } from '@/lib/data/userStore';
import type { EnergyUnit } from '@/lib/units';
import GoalsScreen from '@/app/profile/goals';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const PROFILE = {
  weightKg: 82,
  heightCm: 178,
  age: 30,
  sex: 'male' as const,
  activityLevel: 'moderate' as const,
  goal: 'lose' as const,
};

beforeEach(() => {
  useSettingsStore.getState().reset();
  useUserStore.getState().setProfile(PROFILE);
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: false, status: 404, json: async () => ({ data: null, error: 'error' }) }),
  );
});

async function calorieLabel(unit: EnergyUnit): Promise<string> {
  useSettingsStore.getState().setUnit('energy', unit);
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GoalsScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  const [field] = findAll(
    tree,
    (p) => typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.startsWith(en.goals.dailyCalories),
  );
  return field.props.accessibilityLabel as string;
}

test('speaks the kcal unit as a word', async () => {
  const label = await calorieLabel('kcal');
  expect(label).toBe(`${en.goals.dailyCalories}, ${en.goals.caloriesSpoken}`);
  expect(label).toContain('calories');
  expect(label).not.toContain('kcal');
});

test('keeps the kJ abbreviation for a kJ figure', async () => {
  const label = await calorieLabel('kJ');
  expect(label).toBe(`${en.goals.dailyCalories}, kJ`);
  expect(label).not.toContain(en.goals.caloriesSpoken);
});
