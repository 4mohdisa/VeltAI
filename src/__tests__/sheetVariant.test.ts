// V1 — which sheets wear the design's header. The seven design-covered sheets
// use the 'leading' variant and save with a bottom pill, never a header tick;
// the parked gym/freeze sheet keeps the standard header, untouched.
import { readFileSync } from 'fs';
import { join } from 'path';

const app = (route: string) => readFileSync(join(__dirname, '..', 'app', `${route}.tsx`), 'utf8');

const DESIGN_SHEETS = [
  'food/add',
  'food/calendar',
  'food/custom-food',
  'food/detail',
  'food/quick-add',
  'food/saved',
  'gym/log-session',
];

test.each(DESIGN_SHEETS)('%s uses the design header and no header save', (route) => {
  const src = app(route);
  const sheets = src.match(/<SheetContent\b[^>]*>/g) ?? [];
  expect(sheets.length).toBeGreaterThan(0);
  for (const tag of sheets) {
    expect(tag).toContain('variant="leading"');
    expect(tag).not.toMatch(/\bonDone=/);
  }
});

test('the sheets that used to save from the header now save with a pill', () => {
  expect(app('food/custom-food')).toMatch(/<Button title="Save food" onPress=\{done\} disabled=\{!canSave\} \/>/);
  expect(app('gym/log-session')).toMatch(/<Button title="Log session" onPress=\{save\} \/>/);
  expect(app('food/detail')).toMatch(/<Button title=\{ctaLabel\} onPress=\{\(\) => onDone\(draft\(\)\)\} \/>/);
});

test('the parked freeze sheet keeps the standard header — not restyled by this pass', () => {
  const src = app('gym/freeze');
  expect(src).not.toContain('variant="leading"');
  expect(src).toMatch(/onDone=/);
});
