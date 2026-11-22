// PHASE3_ROWS.md row 15, SettingsList (src/components/display/SettingsList.tsx)
// copy: a destructive link row with no hint of its own falls back to the
// settings.destructiveHint VoiceOver hint in the active language.
import { SettingsList } from '@/components/display/SettingsList';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

const LABEL = 'Delete';

const hintOf = () => {
  const tree = renderScreen(<SettingsList rows={[{ icon: 'trash-outline', label: LABEL, destructive: true, onPress: jest.fn() }]} />);
  const row = findAll(tree, (p) => p.accessibilityRole === 'button' && p.accessibilityLabel === LABEL)[0];
  return row.props.accessibilityHint;
};

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: the destructive row hint reads from en.json', () => {
  expect(hintOf()).toBe(en.settings.destructiveHint);
});

test('Spanish: the destructive row hint reads from es.json, not the English text', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const hint = hintOf();
  expect(hint).toBe(es.settings.destructiveHint);
  expect(hint).not.toBe(en.settings.destructiveHint);
});
