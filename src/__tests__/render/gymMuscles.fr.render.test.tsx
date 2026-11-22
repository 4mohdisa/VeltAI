// PHASE3_ROWS.md row 14, Gym muscles screen (src/app/gym/muscles.tsx) in French.
// The empty state is the call site gymMuscles.shape.render.test.tsx pins in
// English; rendered after a switch to French it reads fr.json, not en.json.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MuscleFocusScreen from '@/app/gym/muscles';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({ useGymPatterns: jest.fn() }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('fr: the empty state reads fr.json, with no English left', async () => {
  await act(async () => {
    await i18n.changeLanguage('fr');
  });
  (useGymPatterns as jest.Mock).mockReturnValue({ patterns: null, loading: false });

  const text = allText(
    renderScreen(
      <SafeAreaProvider initialMetrics={METRICS}>
        <MuscleFocusScreen />
      </SafeAreaProvider>,
    ),
  );
  expect(text).toContain(fr.gymMuscles.emptyTitle);
  expect(text).toContain(fr.gymMuscles.emptyMessage);
  expect(text).not.toContain(en.gymMuscles.emptyTitle);
  expect(text).not.toContain(en.gymMuscles.emptyMessage);
});
