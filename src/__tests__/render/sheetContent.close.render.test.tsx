// PHASE3_ROWS.md row 14: the sheet close control's accessibility label follows
// the app language. Both SheetContent headers are checked: the standard one
// (GlassCloseButton, as on the gym freeze sheet) and the leading one. The label
// is read from en.json, then from es.json after a language switch.
import { Text as RNText } from 'react-native';

import { SheetContent } from '@/components/navigation/SheetContent';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

const closeButtons = (tree: ReturnType<typeof renderScreen>, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function');

const renderSheet = (variant: 'standard' | 'leading') =>
  renderScreen(
    <SheetContent variant={variant} title="Sheet" onClose={() => {}} onDone={() => {}}>
      <RNText>body</RNText>
    </SheetContent>,
  );

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each(['standard', 'leading'] as const)('the %s header close label comes from en.json', (variant) => {
  const tree = renderSheet(variant);
  expect(closeButtons(tree, en.common.close).length).toBeGreaterThan(0);
});

test.each(['standard', 'leading'] as const)('the %s header close label switches to es.json', async (variant) => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = renderSheet(variant);
  expect(closeButtons(tree, es.common.close).length).toBeGreaterThan(0);
  expect(closeButtons(tree, en.common.close).length).toBe(0);
});
