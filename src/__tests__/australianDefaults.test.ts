// Australia first: the defaults a new user gets, kJ conversion, Australian
// measures and dates, the device time zone on every API call, and en-AU
// spelling in the English strings.
import en from '@/lib/i18n/locales/en.json';
import { api, setAuthTokenProvider } from '@/lib/api';
import { weekOf, monthGrid } from '@/lib/data/foodDays';
import { dateLocale, formatLongDate } from '@/lib/formatting';
import { useSettingsStore } from '@/lib/settings/store';
import {
  AU_MEASURES_ML,
  METRIC_PREFERENCES,
  UNIT_OPTIONS,
  displayToKcal,
  formatEnergy,
  kcalToDisplay,
  servingToCanonical,
  systemOf,
} from '@/lib/units';

afterEach(() => {
  useSettingsStore.getState().reset();
  setAuthTokenProvider(() => Promise.resolve(null));
});

describe('new user defaults', () => {
  test('metric units, with kJ offered next to kcal', () => {
    expect(useSettingsStore.getState().units).toEqual(METRIC_PREFERENCES);
    expect(UNIT_OPTIONS.energy.map((o) => o.value)).toEqual(['kcal', 'kJ']);
  });

  test('choosing kJ keeps the rest metric', () => {
    useSettingsStore.getState().setUnit('energy', 'kJ');
    const units = useSettingsStore.getState().units;
    expect(units).toEqual({ ...METRIC_PREFERENCES, energy: 'kJ' });
    expect(systemOf(units)).toBe('custom');
  });

  test('the week starts on Monday', () => {
    // 25 Nov 2026 is a Wednesday.
    expect(weekOf('2026-11-25')[0]).toBe('2026-11-23');
    expect(weekOf('2026-11-25')[6]).toBe('2026-11-29');
    // November 2026 starts on a Sunday: six blank Monday-first cells lead.
    expect(monthGrid('2026-11-25').slice(0, 7)).toEqual([null, null, null, null, null, null, '2026-11-01']);
  });
});

describe('kilojoules', () => {
  test('kcal to kJ and back at 4.184', () => {
    expect(kcalToDisplay(100, 'kJ')).toBe(418);
    expect(kcalToDisplay(2000, 'kJ')).toBe(8368);
    expect(displayToKcal(418.4, 'kJ')).toBeCloseTo(100, 6);
    expect(displayToKcal(8700, 'kJ')).toBeCloseTo(2079.35, 2);
    expect(kcalToDisplay(100, 'kcal')).toBe(100);
  });

  test('formats kJ with Australian grouping', () => {
    expect(formatEnergy(2000, 'kJ')).toBe('8,368 kJ');
    expect(formatEnergy(2000, 'kcal')).toBe('2,000 kcal');
  });
});

describe('Australian measures', () => {
  test('cup 250 ml, tablespoon 20 ml, teaspoon 5 ml', () => {
    expect(AU_MEASURES_ML).toEqual({ cup: 250, tbsp: 20, tsp: 5 });
    expect(servingToCanonical(1, 'cup')).toEqual({ quantity: 250, unit: 'ml' });
    expect(servingToCanonical(2, ' Tbsp. ')).toEqual({ quantity: 40, unit: 'ml' });
    expect(servingToCanonical(3, 'teaspoons')).toEqual({ quantity: 15, unit: 'ml' });
  });

  test('metric units pass through; unknown units stay grams', () => {
    expect(servingToCanonical(330, 'mL')).toEqual({ quantity: 330, unit: 'ml' });
    expect(servingToCanonical(1.5, 'L')).toEqual({ quantity: 1500, unit: 'ml' });
    expect(servingToCanonical(0.2, 'kg')).toEqual({ quantity: 200, unit: 'g' });
    expect(servingToCanonical(30, 'g')).toEqual({ quantity: 30, unit: 'g' });
    expect(servingToCanonical(30, '')).toEqual({ quantity: 30, unit: 'g' });
    expect(servingToCanonical(1, 'slice')).toEqual({ quantity: 1, unit: 'g' });
  });
});

describe('dates', () => {
  const date = new Date(2026, 10, 5); // 5 November 2026

  test('English dates are Australian: dd/mm/yyyy, day before month', () => {
    expect(dateLocale('en')).toBe('en-AU');
    expect(date.toLocaleDateString(dateLocale('en'), { day: '2-digit', month: '2-digit', year: 'numeric' })).toBe('05/11/2026');
    expect(date.toLocaleDateString(dateLocale('en'), { day: 'numeric', month: 'short' })).toBe('5 Nov');
    expect(formatLongDate(date)).toBe('Thu 5 Nov 2026');
  });

  test('other languages keep their own format', () => {
    expect(dateLocale('es')).toBe('es');
    expect(dateLocale('fr')).toBe('fr');
  });
});

test('every API call carries the device time zone', async () => {
  const fetchFn = jest.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({ data: {}, error: null }) }),
  );
  (globalThis as unknown as { fetch: unknown }).fetch = fetchFn;
  await api.goals.get();
  const headers = fetchFn.mock.calls[0][1]?.headers as Record<string, string>;
  expect(headers['X-Timezone']).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
});

test('English strings use Australian spelling', () => {
  const american = /\b(fiber|color|flavor|favorite|center|analyze|organize|customize|personalize|behavior|yogurt)s?\b/i;
  const offenders: string[] = [];
  const walk = (o: unknown, path: string) => {
    if (typeof o === 'string') {
      if (american.test(o)) offenders.push(`${path}: ${o}`);
    } else if (o && typeof o === 'object') {
      for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`);
    }
  };
  walk(en, 'en');
  expect(offenders).toEqual([]);
});
