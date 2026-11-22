// PHASE3_ROWS.md row 15, BrainProfileCard (src/components/ai/BrainProfileCard.tsx)
// copy. useBrainProfile is mocked the way the insights tests mock it, so nothing
// reaches the network. Both states render in Spanish with no English left, and
// every key the card uses exists in en, es and fr.
import { readFileSync } from 'fs';
import { join } from 'path';

import { BrainProfileCard } from '@/components/ai/BrainProfileCard';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

const PROFILE = {
  typical_daily_calories: 2140.4,
  goal_adherence_score: 71.6,
  gym_patterns: { most_active_day: 'monday' },
  scan_accuracy_profile: { overall_accuracy_pct: 88 },
  last_rebuilt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
};

const mockBrain = { profile: PROFILE as typeof PROFILE | null, notEnoughData: false };

jest.mock('@/lib/data/aiBrain', () => ({
  useBrainProfile: jest.fn(() => ({ profile: mockBrain.profile, loading: false, notEnoughData: mockBrain.notEnoughData })),
}));

const fill = (s: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((out, [k, v]) => out.replace(`{{${k}}}`, String(v)), s);

beforeAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
});

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

beforeEach(() => {
  mockBrain.profile = PROFILE;
  mockBrain.notEnoughData = false;
});

test('the profile state reads from es.json', () => {
  const tree = renderScreen(<BrainProfileCard onAskLume={jest.fn()} />);
  const text = allText(tree);
  const b = es.insights.brainProfile;

  expect(text).toContain(b.title);
  expect(text).toContain(b.typicalIntake);
  expect(text).toContain(fill(b.typicalIntakeValue, { value: 2140 }));
  expect(text).toContain(b.goalAdherence);
  expect(text).toContain(fill(b.goalAdherenceValue, { value: 72 }));
  expect(text).toContain(b.mostActiveDay);
  expect(text).toContain(b.scanAccuracy);
  expect(text).toContain(fill(b.scanAccuracyValue, { value: 88 }));
  expect(text).toContain(fill(b.updated, { time: fill(b.hoursAgo_other, { count: 3 }) }));
  expect(findAll(tree, (p) => p.accessibilityLabel === es.insights.askLume && typeof p.onPress === 'function').length).toBeGreaterThan(0);

  for (const english of [en.insights.brainProfile.title, en.insights.brainProfile.typicalIntake, en.insights.askLume, 'Updated']) {
    expect(text).not.toContain(english);
  }
});

test('the still-learning state reads from es.json', () => {
  mockBrain.profile = null;
  mockBrain.notEnoughData = true;
  const text = allText(renderScreen(<BrainProfileCard />));

  expect(text).toContain(es.insights.brainProfile.learningTitle);
  expect(text).toContain(es.insights.brainProfile.learningMessage);
  expect(text).not.toContain(en.insights.brainProfile.learningTitle);
  expect(text).not.toContain(en.insights.brainProfile.learningMessage);
});

test('every key the card uses exists in en, es and fr', () => {
  const src = readFileSync(join(__dirname, '..', '..', 'components', 'ai', 'BrainProfileCard.tsx'), 'utf8');
  const keys = [...src.matchAll(/\bt\('([^']+)'/g)].map((m) => m[1]);
  expect(keys.length).toBeGreaterThan(0);
  const lookup = (locale: object, key: string) =>
    key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], locale);
  const plurals = ['hoursAgo', 'daysAgo'];
  for (const locale of [en, es, fr]) {
    for (const key of keys) {
      const forms = plurals.some((p) => key.endsWith(`.${p}`)) ? [`${key}_one`, `${key}_other`] : [key];
      for (const form of forms) expect(typeof lookup(locale, form)).toBe('string');
    }
  }
});

test('the most active day is shown as a Spanish weekday', () => {
  mockBrain.profile = { ...PROFILE, gym_patterns: { most_active_day: 'Monday' } };
  const text = allText(renderScreen(<BrainProfileCard />));

  expect(text).toContain(es.insights.brainProfile.weekdays.monday);
  expect(text).not.toContain('Monday');
});

test('the seven weekday keys exist in en, es and fr', () => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  for (const locale of [en, es, fr]) {
    for (const day of days) expect(typeof locale.insights.brainProfile.weekdays[day]).toBe('string');
  }
});

describe.each([
  ['es', es],
  ['fr', fr],
])('%s: the most active day fallback', (lang, locale) => {
  const withGym = (gym_patterns: Record<string, unknown>) => ({ ...PROFILE, gym_patterns }) as unknown as typeof PROFILE;

  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage(lang);
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('es');
    });
  });

  test('only preferred_weekdays is sent: its first weekday is translated', () => {
    mockBrain.profile = withGym({ preferred_weekdays: ['friday'] });
    const text = allText(renderScreen(<BrainProfileCard />));

    expect(text).toContain(locale.insights.brainProfile.weekdays.friday);
    expect(text).not.toContain(en.insights.brainProfile.weekdays.friday);
  });

  test('most_active_day with an empty preferred_weekdays: most_active_day is translated', () => {
    mockBrain.profile = withGym({ most_active_day: 'wednesday', preferred_weekdays: [] });
    const text = allText(renderScreen(<BrainProfileCard />));

    expect(text).toContain(locale.insights.brainProfile.weekdays.wednesday);
    expect(text).not.toContain(en.insights.brainProfile.weekdays.wednesday);
  });
});
