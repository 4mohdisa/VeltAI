// PHASE3_ROWS.md row 15, Quick add meal chips (src/app/food/quick-add.tsx) in
// English, Spanish and French. Each chip's visible label and spoken label carry
// the addMenu slot name from the active locale file via mealSlotName. Render
// only, so nothing reaches the network and the shared expo-router mock's empty
// params are enough.
import QuickAddScreen from '@/app/food/quick-add';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('meal chips show and speak the %s slot names', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(<QuickAddScreen />);

  const text = allText(tree);
  for (const name of [locale.addMenu.breakfast, locale.addMenu.lunch, locale.addMenu.dinner, locale.addMenu.snack]) {
    expect(text).toContain(name);
    expect(findAll(tree, (p) => p.accessibilityLabel === name)).not.toHaveLength(0);
  }
  expect(text).not.toContain('addMenu.');
});
