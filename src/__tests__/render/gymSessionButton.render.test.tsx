// The logged pill follows the app language: its visible text and its
// screen-reader label both come from the gym keys, in every supported locale.
import { GymSessionButton } from '@/components/domain/GymSessionButton';
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
])('%s: logged state text and label', async (lang, strings) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const tree = renderScreen(<GymSessionButton logged onPress={jest.fn()} />);
  expect(allText(tree)).toContain(strings.gym.loggedToday);
  expect(findAll(tree, (p) => p.accessibilityLabel === strings.gym.loggedTodayLabel).length).toBeGreaterThan(0);
});
