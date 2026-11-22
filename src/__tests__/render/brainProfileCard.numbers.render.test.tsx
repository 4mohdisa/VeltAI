// PHASE3_ROWS.md row 15, BrainProfileCard (src/components/ai/BrainProfileCard.tsx)
// numbers. A non-round typical intake (2140.4 kcal) renders rounded in the user's
// energy unit: kcal with typicalIntakeValue, kJ (converted by kcalToDisplay)
// with typicalIntakeValueKj, in English and French. useBrainProfile is mocked,
// so nothing reaches the network.
import { BrainProfileCard } from '@/components/ai/BrainProfileCard';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useSettingsStore } from '@/lib/settings/store';
import { kcalToDisplay } from '@/lib/units';
import { act, allText, renderScreen } from './helpers';

const KCAL = 2140.4;
const mockProfile = {
  typical_daily_calories: KCAL,
  goal_adherence_score: null,
  gym_patterns: null,
  scan_accuracy_profile: null,
  last_rebuilt: null,
};

jest.mock('@/lib/data/aiBrain', () => ({
  useBrainProfile: () => ({ profile: mockProfile, loading: false, notEnoughData: false }),
}));

afterEach(async () => {
  useSettingsStore.getState().reset();
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['fr', fr],
])('%s: typical intake follows the energy unit', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const b = locale.insights.brainProfile;

  useSettingsStore.getState().setUnit('energy', 'kcal');
  const kcalText = allText(renderScreen(<BrainProfileCard />));
  expect(kcalText).toContain(b.typicalIntakeValue.replace('{{value}}', '2140'));

  useSettingsStore.getState().setUnit('energy', 'kJ');
  const kjText = allText(renderScreen(<BrainProfileCard />));
  expect(kjText).toContain(b.typicalIntakeValueKj.replace('{{value}}', String(kcalToDisplay(KCAL, 'kJ'))));
  expect(kjText).not.toContain('kcal');
});
