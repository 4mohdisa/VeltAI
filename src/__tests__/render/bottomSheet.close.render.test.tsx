// PHASE3_ROWS.md row 14: the BottomSheet backdrop's close label follows the app
// language. The label is read from en.json, then from es.json after a language
// switch, the same way sheetContent.close.render.test.tsx checks SheetContent.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Text } from '@/components/primitives/Text';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const renderSheet = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <BottomSheet visible onClose={() => {}}>
        <Text variant="body">body</Text>
      </BottomSheet>
    </SafeAreaProvider>,
  );

const backdrops = (tree: ReturnType<typeof renderSheet>, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onTouchEnd === 'function');

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('the backdrop close label comes from en.json', () => {
  expect(backdrops(renderSheet(), en.common.close).length).toBeGreaterThan(0);
});

test('the backdrop close label switches to es.json', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = renderSheet();
  expect(backdrops(tree, es.common.close).length).toBeGreaterThan(0);
  expect(backdrops(tree, en.common.close).length).toBe(0);
});
