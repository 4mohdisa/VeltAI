// PHASE3_ROWS.md row 8, step 1: every event has an allowlist of properties, and
// a property survives only when its key is listed and its value fits the rule
// (an enum tag, a non-negative integer count, or a boolean). fetch is mocked;
// secure-store is the in-memory jest mock (moduleNameMapper).
import { useSettingsStore } from '@/lib/settings/store';
import {
  ALLOWED_EVENTS,
  flushAnalytics,
  sanitize,
  track,
  __resetForTests,
  type AnalyticsEventName,
} from '@/lib/analytics';

const EVENTS: AnalyticsEventName[] = [
  'session_started',
  'onboarding_step_viewed',
  'onboarding_completed',
  'food_logged',
  'scan_started',
  'scan_completed',
  'scan_failed',
  'scan_confirmed',
  'scan_corrected',
  'scan_discarded',
  'workout_logged',
  'template_created',
  'integration_connected',
  'paywall_viewed',
  'purchase_started',
  'purchase_completed',
  'purchase_cancelled',
  'purchase_restored',
  'trial_started',
  'feature_used',
];

beforeEach(async () => {
  useSettingsStore.getState().setAnalyticsEnabled(true);
  await __resetForTests();
});
afterEach(() => jest.restoreAllMocks());

test('every event has an allowlist entry, and nothing else does', () => {
  expect(Object.keys(ALLOWED_EVENTS).sort()).toEqual([...EVENTS].sort());
});

test('a property not on the event’s list is dropped', () => {
  expect(sanitize('scan_started', { entry: 'camera', calories: 420 })).toEqual({ entry: 'camera' });
  // Listed for a different event only.
  expect(sanitize('workout_logged', { entry: 'camera' })).toBeUndefined();
});

test('a value of the wrong type is dropped', () => {
  expect(sanitize('onboarding_step_viewed', { step: 'goal', index: 'two' })).toEqual({ step: 'goal' });
  expect(sanitize('scan_started', { entry: 1 })).toBeUndefined();
});

test('an enum value outside its list is dropped', () => {
  expect(sanitize('integration_connected', { provider: 'fitbit' })).toBeUndefined();
  expect(sanitize('food_logged', { method: 'Manual' })).toBeUndefined();
});

test('a free text string is dropped', () => {
  expect(sanitize('feature_used', { name: 'Grandma’s chicken stir-fry' })).toBeUndefined();
  expect(sanitize('scan_failed', { entry: 'label', reason: 'Server said: 2 eggs, 140 kcal' })).toEqual({
    entry: 'label',
  });
});

test('a negative or decimal count is dropped', () => {
  expect(sanitize('onboarding_step_viewed', { index: -1 })).toBeUndefined();
  expect(sanitize('onboarding_step_viewed', { index: 2.5 })).toBeUndefined();
  expect(sanitize('onboarding_step_viewed', { index: Number.POSITIVE_INFINITY })).toBeUndefined();
});

test('a valid event keeps its allowed properties on the wire', async () => {
  track('scan_failed', { entry: 'barcode', reason: 'not_found', weight_kg: 82 });
  const fn = jest.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve({ ok: true, status: 202, json: async () => ({ data: { accepted: 1 }, error: null }) }),
  );
  (globalThis as unknown as { fetch: unknown }).fetch = fn;
  await flushAnalytics();

  const [event] = (JSON.parse((fn.mock.calls[0][1] as RequestInit).body as string) as {
    events: { name: string; properties: Record<string, unknown> }[];
  }).events;
  expect(event.name).toBe('scan_failed');
  expect(event.properties).toMatchObject({ entry: 'barcode', reason: 'not_found' });
  expect(event.properties).not.toHaveProperty('weight_kg');
});

// Every track() call in the app, read from source: each property key must be on
// that event's allowlist and each quoted value must be one of its tags, so an
// off-list property fails here instead of being dropped quietly at runtime.
// A call whose properties are not an object literal cannot be checked, so it
// fails too.
describe('track() call sites', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readdirSync, readFileSync } = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { join, relative } = require('path') as typeof import('path');
  const SRC = join(__dirname, '..');

  const sourceFiles = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(path);
      return /\.tsx?$/.test(entry.name) ? [path] : [];
    });

  type Call = { where: string; event: string; props: string | null; rest: string };
  const calls: Call[] = sourceFiles(SRC).flatMap((file) => {
    const src = readFileSync(file, 'utf8');
    return [...src.matchAll(/\btrack\(\s*'([^']+)'\s*([,)])/g)].map((m) => {
      const after = src.slice((m.index ?? 0) + m[0].length);
      const literal = m[2] === ',' ? /^\s*\{([^}]*)\}\s*\)/.exec(after) : null;
      return {
        where: `${relative(SRC, file)}: ${m[0]}`,
        event: m[1],
        props: literal ? literal[1] : null,
        rest: m[2] === ',' ? after.trimStart().slice(0, 1) : ')',
      };
    });
  });

  test('finds the app’s track() calls', () => {
    expect(calls.length).toBeGreaterThan(20);
  });

  test('every call names an allowlisted event', () => {
    const unknown = calls.filter((c) => !(c.event in ALLOWED_EVENTS)).map((c) => c.where);
    expect(unknown).toEqual([]);
  });

  test('every call passes no properties or an object literal', () => {
    const unchecked = calls.filter((c) => c.rest !== ')' && c.props === null).map((c) => c.where);
    expect(unchecked).toEqual([]);
  });

  test('every property key is on its event’s allowlist and every quoted value is one of its tags', () => {
    const problems: string[] = [];
    for (const c of calls) {
      if (!c.props || !(c.event in ALLOWED_EVENTS)) continue;
      const rules = ALLOWED_EVENTS[c.event as AnalyticsEventName];
      for (const part of c.props.split(',').map((p) => p.trim()).filter(Boolean)) {
        const [rawKey, ...valueParts] = part.split(':');
        const key = rawKey.trim();
        const rule = Object.prototype.hasOwnProperty.call(rules, key) ? rules[key] : undefined;
        if (!rule) {
          problems.push(`${c.where} key "${key}"`);
          continue;
        }
        const value = valueParts.join(':').trim();
        const quoted = /^'([^']*)'$/.exec(value);
        if (quoted && (rule.kind !== 'enum' || !rule.values.includes(quoted[1]))) {
          problems.push(`${c.where} ${key}: '${quoted[1]}'`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
