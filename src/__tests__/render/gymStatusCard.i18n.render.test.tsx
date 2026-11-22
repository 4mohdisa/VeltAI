// PHASE3_ROWS.md row 15, Summary GymStatusCard (src/components/domain/GymStatusCard.tsx)
// copy. Both states are rendered in English, Spanish and French; every string
// reads from its locale file and no English literal is left in es or fr.
import { GymStatusCard } from '@/components/domain/GymStatusCard';
import { formatDuration } from '@/lib/formatting';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

type Locale = typeof en;

const DURATION_MIN = 42;

const strings = (l: Locale) => ({
  title: l.dashboard.gymSessionTitle,
  notLogged: l.dashboard.gymSessionNotLogged,
  logAction: l.addMenu.logGymSession,
  loggedToday: l.gym.loggedToday,
  duration: l.dashboard.gymSessionDuration.replace('{{duration}}', formatDuration(DURATION_MIN)),
});

const renderBoth = () => ({
  notLogged: renderScreen(<GymStatusCard logged={false} onLog={jest.fn()} />),
  logged: renderScreen(<GymStatusCard logged onLog={jest.fn()} durationMin={DURATION_MIN} />),
});

type Tree = ReturnType<typeof renderScreen>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const hasLabel = (tree: Tree, label: string) => findAll(tree, (p) => p.accessibilityLabel === label).length > 0;

function expectLocale(l: Locale) {
  const s = strings(l);
  const { notLogged, logged } = renderBoth();
  expect(allText(notLogged)).toContain(s.title);
  expect(hasText(notLogged, s.notLogged)).toBe(true);
  expect(hasLabel(notLogged, s.logAction)).toBe(true);
  expect(allText(notLogged)).toContain(s.logAction);
  expect(hasText(logged, s.loggedToday)).toBe(true);
  expect(hasText(logged, s.duration)).toBe(true);
  return allText(notLogged) + allText(logged);
}

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: both states read from en.json', () => {
  expectLocale(en);
});

test.each([
  ['es', es],
  ['fr', fr],
])('%s: both states read from the locale file and no English literal remains', async (lang, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const text = expectLocale(locale as Locale);
  for (const english of Object.values(strings(en))) {
    expect(text).not.toContain(english);
  }
});
