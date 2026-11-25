// The onboarding scaffold's back control is labelled in the app language. It
// reuses common.goBack, the same key as the app's other back controls.
import { Text } from 'react-native';
import { router } from 'expo-router';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, findAll, renderScreen } from './helpers';
import { ONBOARDING_ROOT } from '@/lib/onboarding/resume';

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the back control reads its label from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <OnbScaffold title="Step">
      <Text>Body</Text>
    </OnbScaffold>,
  );

  const back = findAll(tree, (p) => p.accessibilityLabel === locale.common.goBack && typeof p.onPress === 'function');
  expect(back[0]).toBeDefined();
  if (lng !== 'en') expect(findAll(tree, (p) => p.accessibilityLabel === en.common.goBack)).toHaveLength(0);
});

function pressBack() {
  const tree = renderScreen(
    <OnbScaffold title="Step">
      <Text>Body</Text>
    </OnbScaffold>,
  );
  const back = findAll(tree, (p) => p.accessibilityLabel === en.common.goBack && typeof p.onPress === 'function')[0];
  act(() => (back.props.onPress as () => void)());
}

test('back with history goes back', () => {
  pressBack();
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.replace).not.toHaveBeenCalled();
});

test('back without history (a resumed step) goes to the start of onboarding', () => {
  jest.spyOn(router, 'canGoBack').mockReturnValueOnce(false);
  pressBack();
  expect(router.back).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith(ONBOARDING_ROOT);
});
