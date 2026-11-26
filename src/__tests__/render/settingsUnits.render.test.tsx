// Row 14b Fix 8: units. Settings (Profile > Preferences) switches between metric
// and imperial through the settings store, and the units picked on the onboarding
// measurements step reach that same store, so Preferences opens on them.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MeasurementsScreen from '@/app/onboarding/measurements';
import PreferencesScreen from '@/app/profile/preferences';
import en from '@/lib/i18n/locales/en.json';
import { useSettingsStore } from '@/lib/settings/store';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { IMPERIAL_PREFERENCES, METRIC_PREFERENCES } from '@/lib/units';
import { act, buttonWithTitle, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const press = (tree: ReturnType<typeof renderScreen>, label: string) => {
  const option = findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function')[0];
  act(() => (option.props.onPress as () => void)());
};

beforeEach(() => {
  useSettingsStore.getState().reset();
  useOnboardingStore.getState().reset();
});

test('the Preferences units row switches between metric and imperial and saves it in the settings store', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PreferencesScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {});

  press(tree, en.preferences.imperial);
  expect(useSettingsStore.getState().units).toEqual(IMPERIAL_PREFERENCES);
  press(tree, en.preferences.metric);
  expect(useSettingsStore.getState().units).toEqual(METRIC_PREFERENCES);
});

test('lb and ft/in chosen on the measurements step are saved as the settings units', () => {
  useOnboardingStore.getState().setGoal('track');
  useOnboardingStore.getState().setMeasurements({
    age: 30,
    sex: 'female',
    height_cm: 170,
    height_unit: 'ftin',
    height_ft_text: '5',
    height_in_text: '7',
    weight_kg: 69.9,
    weight_unit: 'lb',
  });
  const tree = renderScreen(<MeasurementsScreen />);

  act(() => (buttonWithTitle(tree, en.onboarding.measurements.continue)!.props.onPress as () => void)());
  expect(router.push).toHaveBeenCalledWith('/onboarding/body-type');
  expect(useSettingsStore.getState().units).toMatchObject({ weight: 'lb', height: 'ftin' });
});
