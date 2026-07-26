// Unit tests for the pure helper modules. Hermetic: no network, no DB.
// NOTE: src/lib/validation, src/lib/time and src/lib/errors are empty stubs
// (`export {}`) — nothing to test there until they grow exports.
import {
  formatNumber,
  formatCalories,
  formatGrams,
  formatMacro,
  formatCurrency,
  formatDuration,
  formatStreak,
  formatRelativeDate,
  formatLongDate,
  formatTime,
} from '@/lib/formatting';
import {
  METRIC_PREFERENCES,
  IMPERIAL_PREFERENCES,
  systemOf,
  kgToDisplay,
  displayToKg,
  formatWeight,
  cmToFeetInches,
  feetInchesToCm,
  formatHeight,
  gToDisplay,
  displayToG,
  formatMass,
  mlToDisplay,
  displayToMl,
  formatVolume,
  kcalToDisplay,
  displayToKcal,
  formatEnergy,
  deviceUnitPreferences,
} from '@/lib/units';
import { lookupBarcode, exampleBarcodeProduct } from '@/lib/food/barcode';

describe('formatting', () => {
  test.each([
    [0, '0'],
    [-1234.6, '-1,235'],
    [1234567, '1,234,567'],
    [42.4, '42'],
  ])('formatNumber(%p) → %p', (input, expected) => {
    expect(formatNumber(input)).toBe(expected);
  });

  test('formatCalories', () => {
    expect(formatCalories(0)).toBe('0 kcal');
    expect(formatCalories(2500)).toBe('2,500 kcal');
  });

  test('formatGrams rounds, no grouping', () => {
    expect(formatGrams(0)).toBe('0 g');
    expect(formatGrams(32.6)).toBe('33 g');
  });

  test('formatMacro lowercases the name', () => {
    expect(formatMacro('Protein', 32.2)).toBe('32 g protein');
  });

  test.each([
    [0, 'A$0.00'],
    [12.5, 'A$12.50'],
    [9.999, 'A$10.00'],
    [-3, 'A$-3.00'],
  ])('formatCurrency(%p) → %p', (input, expected) => {
    expect(formatCurrency(input)).toBe(expected);
  });

  test.each([
    [0, '0 min'],
    [45, '45 min'],
    [60, '1h'],
    [90, '1h 30m'],
    [125, '2h 5m'],
  ])('formatDuration(%p) → %p', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });

  test.each([
    [0, '0 days'],
    [1, '1 day'],
    [7, '7 days'],
  ])('formatStreak(%p) → %p', (input, expected) => {
    expect(formatStreak(input)).toBe(expected);
  });

  test('formatRelativeDate: today / yesterday / older', () => {
    const now = new Date(2026, 5, 16, 12, 0); // Tue 16 Jun 2026
    expect(formatRelativeDate(new Date(2026, 5, 16, 8, 30), now)).toBe('Today');
    expect(formatRelativeDate(new Date(2026, 5, 15, 23, 59), now)).toBe('Yesterday');
    expect(formatRelativeDate(new Date(2026, 5, 10), now)).toBe('Wed 10 Jun');
  });

  test('formatRelativeDate: yesterday across a month boundary', () => {
    const now = new Date(2026, 6, 1); // Wed 1 Jul 2026
    expect(formatRelativeDate(new Date(2026, 5, 30), now)).toBe('Yesterday');
  });

  test('formatLongDate', () => {
    expect(formatLongDate(new Date(2026, 5, 29))).toBe('Mon 29 Jun 2026');
  });

  test('formatTime zero-pads', () => {
    expect(formatTime(new Date(2026, 0, 1, 18, 0))).toBe('18:00');
    expect(formatTime(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
  });
});

describe('units', () => {
  test.each([
    [METRIC_PREFERENCES, 'metric'],
    [IMPERIAL_PREFERENCES, 'imperial'],
    [{ ...METRIC_PREFERENCES, weight: 'lb' as const }, 'custom'],
  ])('systemOf(%p) → %p', (prefs, expected) => {
    expect(systemOf(prefs)).toBe(expected);
  });

  test('weight: kg identity and lb conversion', () => {
    expect(kgToDisplay(100, 'kg')).toBe(100);
    expect(kgToDisplay(100, 'lb')).toBe(220.5);
    expect(displayToKg(100, 'kg')).toBe(100);
  });

  test('weight round-trips within 0.05 kg', () => {
    expect(displayToKg(kgToDisplay(80, 'lb'), 'lb')).toBeCloseTo(80, 1);
  });

  test.each([
    [80, 'kg' as const, '80 kg'],
    [80.5, 'kg' as const, '80.5 kg'],
    [100, 'lb' as const, '220.5 lb'],
    [1000, 'kg' as const, '1,000 kg'],
  ])('formatWeight(%p, %p) → %p', (kg, unit, expected) => {
    expect(formatWeight(kg, unit)).toBe(expected);
  });

  test('height: cm → ft/in with 12-inch rollover', () => {
    expect(cmToFeetInches(180)).toEqual({ feet: 5, inches: 11 });
    expect(cmToFeetInches(181.7)).toEqual({ feet: 6, inches: 0 }); // rounds to 12 in → rolls to next foot
  });

  test('height round-trips through ft/in', () => {
    expect(feetInchesToCm(5, 11)).toBeCloseTo(180.34, 2);
    expect(cmToFeetInches(feetInchesToCm(6, 0))).toEqual({ feet: 6, inches: 0 });
  });

  test.each([
    [180, 'cm' as const, '180 cm'],
    [180, 'ftin' as const, '5 ft 11 in'],
  ])('formatHeight(%p, %p) → %p', (cm, unit, expected) => {
    expect(formatHeight(cm, unit)).toBe(expected);
  });

  test('mass: g identity and oz conversion', () => {
    expect(gToDisplay(100, 'g')).toBe(100);
    expect(gToDisplay(100, 'oz')).toBe(3.5);
    // display rounds to 0.1 oz (~1.4 g), so round-trip is only close, not exact
    expect(displayToG(gToDisplay(250, 'oz'), 'oz')).toBeCloseTo(250, -1);
    expect(displayToG(50, 'g')).toBe(50);
  });

  test.each([
    [100, 'g' as const, '100 g'],
    [100, 'oz' as const, '3.5 oz'],
    [1000, 'g' as const, '1,000 g'],
  ])('formatMass(%p, %p) → %p', (g, unit, expected) => {
    expect(formatMass(g, unit)).toBe(expected);
  });

  test('volume: ml identity and fl oz conversion', () => {
    expect(mlToDisplay(500, 'ml')).toBe(500);
    expect(mlToDisplay(500, 'floz')).toBe(16.9);
    // display rounds to 0.1 fl oz (~1.5 ml), so round-trip is only close, not exact
    expect(displayToMl(mlToDisplay(750, 'floz'), 'floz')).toBeCloseTo(750, -1);
    expect(displayToMl(330, 'ml')).toBe(330);
  });

  test.each([
    [500, 'ml' as const, '500 ml'],
    [500, 'floz' as const, '16.9 fl oz'],
  ])('formatVolume(%p, %p) → %p', (ml, unit, expected) => {
    expect(formatVolume(ml, unit)).toBe(expected);
  });

  test('energy: kcal identity and kJ conversion', () => {
    expect(kcalToDisplay(500, 'kcal')).toBe(500);
    expect(kcalToDisplay(500, 'kJ')).toBe(2092);
    expect(displayToKcal(2092, 'kJ')).toBeCloseTo(500, 6);
    expect(displayToKcal(500, 'kcal')).toBe(500);
  });

  test.each([
    [2000, 'kcal' as const, '2,000 kcal'],
    [500, 'kJ' as const, '2,092 kJ'],
  ])('formatEnergy(%p, %p) → %p', (kcal, unit, expected) => {
    expect(formatEnergy(kcal, unit)).toBe(expected);
  });

  describe('deviceUnitPreferences (Intl.NumberFormat mocked per branch)', () => {
    const mockLocale = (impl: () => { resolvedOptions: () => { locale?: string } }) =>
      jest
        .spyOn(Intl, 'NumberFormat')
        .mockImplementation(impl as unknown as () => Intl.NumberFormat);

    afterEach(() => jest.restoreAllMocks());

    test('US region → imperial', () => {
      mockLocale(() => ({ resolvedOptions: () => ({ locale: 'en-US' }) }));
      expect(deviceUnitPreferences()).toEqual(IMPERIAL_PREFERENCES);
    });

    test('AU region → metric', () => {
      mockLocale(() => ({ resolvedOptions: () => ({ locale: 'en-AU' }) }));
      expect(deviceUnitPreferences()).toEqual(METRIC_PREFERENCES);
    });

    test('locale without region → metric', () => {
      mockLocale(() => ({ resolvedOptions: () => ({ locale: 'en' }) }));
      expect(deviceUnitPreferences()).toEqual(METRIC_PREFERENCES);
    });

    test('Intl throwing → metric fallback', () => {
      mockLocale(() => {
        throw new Error('no ICU');
      });
      expect(deviceUnitPreferences()).toEqual(METRIC_PREFERENCES);
    });
  });
});

describe('food/barcode', () => {
  // Prove the lookup is a local mock DB, not a network call: any fetch rejects.
  const originalFetch = globalThis.fetch;
  beforeAll(() => {
    globalThis.fetch = jest.fn(() =>
      Promise.reject(new Error('network disabled in tests')),
    ) as unknown as typeof fetch;
  });
  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  test('known barcode resolves the mock product', async () => {
    const product = await lookupBarcode('9300605000000');
    expect(product).toEqual(exampleBarcodeProduct);
    expect(product?.name).toBe('Greek Yoghurt, Plain');
    expect(product?.kcalPer100).toBe(59);
    expect(product?.servingOptions).toContain(100);
  });

  test('unknown barcode resolves null (even with fetch rejecting)', async () => {
    await expect(lookupBarcode('0000000000000')).resolves.toBeNull();
  });
});
