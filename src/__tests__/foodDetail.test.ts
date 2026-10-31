/// <reference types="jest" />
/// <reference types="node" />
// Architecture item 4: four food-detail surfaces folded into ONE sheet.
//
// The app used to show a food four different ways — `food/serving.tsx` for a
// manual-search hit, `food/barcode-confirm.tsx` for a scanned product,
// `food/[meal].tsx` for a logged meal and `FoodItemEditSheet` for everything
// else — each with its own copy of "name, grams, energy, macros". They have
// been replaced by `food/detail.tsx` driven by `lib/food/detailSubject`.
//
// These tests pin the consolidation itself, because the failure mode is a
// silent regrowth: one screen quietly reintroducing its own editor, or a call
// site left pointing at a route that no longer exists.
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

import { useDetailSubject, openFoodDetail } from '@/lib/food/detailSubject';

const SRC = join(__dirname, '..');
const src = (p: string) => readFileSync(join(SRC, p), 'utf8');
const exists = (p: string) => existsSync(join(SRC, p));

/** Every shipped source file — the suites themselves quote the names they ban. */
function walk(dir: string = SRC, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === '__tests__') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const CALL_SITES = [
  'app/(tabs)/food.tsx', // a logged row AND a manual-search result
  'app/food/saved.tsx', // a saved dish
  'app/food/barcode-scan.tsx', // a barcode hit
  'components/food/scan/ScanReviewCard.tsx', // the scan-review rename
];

describe('the four old detail surfaces are gone', () => {
  test.each([
    'app/food/serving.tsx',
    'app/food/barcode-confirm.tsx',
    'app/food/[meal].tsx',
    'components/domain/FoodItemEditSheet.tsx',
  ])('%s no longer exists', (path) => {
    expect(exists(path)).toBe(false);
  });

  test('nothing imports FoodItemEditSheet or EditableItem any more', () => {
    const offenders = walk().filter((f) => /FoodItemEditSheet|EditableItem/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  test('no source still navigates to a deleted route', () => {
    const offenders = walk().filter((f) =>
      /'\/food\/serving'|'\/food\/barcode-confirm'|`\/food\/\$\{/.test(readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  test('the root layout registers the one sheet and neither old one', () => {
    const layout = src('app/_layout.tsx');
    expect(layout).toContain('name="food/detail"');
    expect(layout).not.toContain('food/barcode-confirm');
    expect(layout).not.toContain('name="food/serving"');
  });
});

describe('every call site goes through the one route', () => {
  test.each(CALL_SITES)('%s pushes /food/detail', (path) => {
    const text = src(path);
    expect(text).toContain("'/food/detail'");
    expect(text).toContain('openFoodDetail(');
  });

  test('the subject never travels as a route param', () => {
    // A food name and its macros are personal data; params end up in a URL.
    for (const path of CALL_SITES) {
      expect(src(path)).not.toMatch(/pathname: '\/food\/detail'/);
    }
  });

  test('the food tab keeps the pins other suites rely on', () => {
    const tab = src('app/(tabs)/food.tsx');
    expect(tab).toContain('confidenceFactors: it.confidenceFactors');
    expect(tab).toContain('<AnomalyBanner');
  });
});

describe('the sheet still carries the capabilities it absorbed', () => {
  const sheet = src('app/food/detail.tsx');

  test('the barcode not-found recovery path survives (AUDIT_REPORT M1)', () => {
    expect(sheet).toContain('Product not found');
    expect(sheet).toContain('Scan again');
    expect(sheet).toContain("router.replace('/food/barcode-scan')");
  });

  test('"save to my foods" survives for a logged row', () => {
    expect(sheet).toContain('food.saveToDishes');
    expect(sheet).toContain('saveFood(');
  });

  test('deleting an item is still behind a confirmation', () => {
    expect(sheet).toContain('Alert.alert');
    expect(sheet).toContain('haptics.warning()');
    expect(sheet).toContain('haptics.impactHeavy()');
  });

  test('serving options come from the product, not a fixed list, for a barcode', () => {
    expect(sheet).toContain('servings={p.servingOptions}');
  });

  test('the search branch shows macros from the subject', () => {
    const search = sheet.slice(sheet.indexOf("subject.mode === 'search'"), sheet.indexOf("subject.mode === 'barcode'"));
    expect(search).toMatch(/^\s+macros$/m);
    expect(search).toContain('subject.proteinPer100');
    expect(search).toContain('subject.carbsPer100');
    expect(search).toContain('subject.fatPer100');
  });

  test('logging still names the entry method it came from', () => {
    expect(sheet).toContain("logMeal(slotForNow(), draft, 'manual')");
    expect(sheet).toContain("logMeal(slotForNow(), draft, 'barcode')");
  });
});

describe('V6: a logged row is read, not typed', () => {
  const sheet = src('app/food/detail.tsx');
  const code = sheet.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

  test('its presets come from the row itself, not a catalog', () => {
    expect(sheet).toContain('basisOf(item)');
    expect(sheet).toContain('presetsFor(item.quantityG)');
  });

  test('its numbers stay values until "Edit values manually"', () => {
    expect(sheet).toContain('lockValues={!review}');
    expect(sheet).toContain("t('food.editValuesManually')");
  });

  // Fibre is wired end to end now (item 6), but only where a source provided
  // one: the row renders behind a `fibre != null` guard, and the value is always
  // the item's own — there is no literal fibre number anywhere in the sheet.
  test('fibre shows only when the row actually has one', () => {
    expect(code).toMatch(/fibre != null/);
    expect(code).not.toMatch(/fibre: \d/);
  });

  test('the food tab tells the sheet which meal the row is in', () => {
    expect(src('app/(tabs)/food.tsx')).toContain('openRow(row, section.slot)');
  });
});

describe('the subject store round-trips every mode', () => {
  afterEach(() => useDetailSubject.getState().clearDetail());

  const item = { id: 'it_1', name: 'Oats', quantityG: 40, calories: 150, protein: 5, carbs: 27, fat: 3 };

  test('starts empty', () => {
    expect(useDetailSubject.getState().subject).toBeNull();
  });

  test.each([
    [{ mode: 'search', name: 'Banana', kcalPer100: 89 } as const],
    [{ mode: 'barcode', code: '9300605000000' } as const],
    [{ mode: 'saved', item } as const],
    [{ mode: 'logged', item } as const],
    [{ mode: 'review', item } as const],
  ])('carries a %o subject verbatim', (subject) => {
    openFoodDetail(subject);
    expect(useDetailSubject.getState().subject).toEqual(subject);
  });

  test('opening a second subject replaces the first', () => {
    openFoodDetail({ mode: 'logged', item });
    openFoodDetail({ mode: 'barcode', code: '0000000000000' });
    expect(useDetailSubject.getState().subject).toEqual({ mode: 'barcode', code: '0000000000000' });
  });

  test('clearing empties it', () => {
    openFoodDetail({ mode: 'saved', item });
    useDetailSubject.getState().clearDetail();
    expect(useDetailSubject.getState().subject).toBeNull();
  });
});
