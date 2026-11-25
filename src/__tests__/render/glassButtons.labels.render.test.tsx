// PHASE3_ROWS.md row 14: the glass back and save controls' accessibility labels
// follow the app language. The bare back control reads common.goBack, a labelled
// one reads common.backTo with the previous screen's name, and a save control
// with no label reads common.done. Each is read from en.json, then from es.json
// after a language switch, the same way sheetContent.close.render.test.tsx does.
import { GlassBackButton, GlassSaveButton } from '@/components/navigation/GlassButtons';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

const hasLabel = (tree: ReturnType<typeof renderScreen>, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function').length > 0;

const renderButtons = () =>
  renderScreen(
    <>
      <GlassBackButton onPress={() => {}} />
      <GlassBackButton onPress={() => {}} label="Food" />
      <GlassSaveButton onPress={() => {}} />
    </>,
  );

const expectLabels = (tree: ReturnType<typeof renderScreen>, locale: Locale) => {
  expect(hasLabel(tree, locale.common.goBack)).toBe(true);
  expect(hasLabel(tree, locale.common.backTo.replace('{{label}}', 'Food'))).toBe(true);
  expect(hasLabel(tree, locale.common.done)).toBe(true);
};

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('the back, back-to and done labels come from en.json', () => {
  expectLabels(renderButtons(), en);
});

test('the back, back-to and done labels switch to es.json', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = renderButtons();
  expectLabels(tree, es);
  expect(hasLabel(tree, en.common.goBack)).toBe(false);
  expect(hasLabel(tree, en.common.done)).toBe(false);
});
