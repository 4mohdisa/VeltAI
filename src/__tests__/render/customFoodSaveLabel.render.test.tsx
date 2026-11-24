// The custom food form's save pill reads customFood.saveButton in the app
// language, not a hardcoded English "Save food".
import CustomFoodScreen from '@/app/food/custom-food';
import i18n from '@/lib/i18n';
import { act, buttonWithTitle, renderScreen } from './helpers';

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['es', 'Guardar alimento'],
  ['fr', 'Enregistrer l’aliment'],
  ['en', 'Save food'],
])('%s: the save button reads %s', async (lang, label) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const tree = renderScreen(<CustomFoodScreen />);
  expect(buttonWithTitle(tree, label)).toBeTruthy();
});
