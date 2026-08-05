/// <reference types="jest" />
/// <reference types="node" />
// The capture system's load-bearing behaviour: bounded buffers, real redaction,
// and a well-formed export.
//
// The buffers run for a week or two of real use on a real phone, so "bounded"
// is not a nicety — an unbounded log would become the bug being hunted. And the
// export is pasted into a chat window, so a leaked bearer token travels a long
// way.
//
// These import ../debug/buffers and ../debug/export directly: both are pure and
// dependency-free, so they are testable without the flag on. (The flag IS off in
// jest, so the recorders no-op — each test forces it on where it needs to.)
import { CONSOLE_LIMIT, API_LIMIT, BREADCRUMB_LIMIT, redact, redactValue } from '@/debug/buffers';
import { reportToMarkdown, reportsToMarkdown, reportsToJSON } from '@/debug/export';
import type { DebugReport } from '@/debug/types';

// The recorders are gated on DEBUG_CAPTURE, which is false under jest. Re-import
// the module with the env var set so the ring behaviour is observable.
function withCaptureOn<T>(fn: (m: typeof import('@/debug/buffers')) => T): T {
  const prev = process.env.EXPO_PUBLIC_DEBUG_CAPTURE;
  process.env.EXPO_PUBLIC_DEBUG_CAPTURE = '1';
  jest.resetModules();
  try {
    return fn(require('@/debug/buffers'));
  } finally {
    if (prev === undefined) delete process.env.EXPO_PUBLIC_DEBUG_CAPTURE;
    else process.env.EXPO_PUBLIC_DEBUG_CAPTURE = prev;
    jest.resetModules();
  }
}

describe('ring buffers are bounded and never leak', () => {
  test('the console ring keeps the newest CONSOLE_LIMIT entries, oldest first', () => {
    withCaptureOn((m) => {
      m.__clearBuffers();
      for (let i = 0; i < CONSOLE_LIMIT * 3; i++) m.recordConsole('log', [`line ${i}`]);
      const got = m.readConsole();
      expect(got).toHaveLength(CONSOLE_LIMIT);
      // Oldest → newest, and the oldest surviving line is the right one.
      expect(got[0].text).toContain(`line ${CONSOLE_LIMIT * 3 - CONSOLE_LIMIT}`);
      expect(got[got.length - 1].text).toContain(`line ${CONSOLE_LIMIT * 3 - 1}`);
    });
  });

  test('the API ring is bounded to API_LIMIT', () => {
    withCaptureOn((m) => {
      m.__clearBuffers();
      for (let i = 0; i < API_LIMIT * 4; i++) {
        m.recordApiCall({ method: 'GET', path: `/api/x/${i}`, status: 200, durationMs: i });
      }
      const got = m.readApi();
      expect(got).toHaveLength(API_LIMIT);
      expect(got[got.length - 1].path).toBe(`/api/x/${API_LIMIT * 4 - 1}`);
    });
  });

  test('the breadcrumb ring is bounded to BREADCRUMB_LIMIT', () => {
    withCaptureOn((m) => {
      m.__clearBuffers();
      for (let i = 0; i < BREADCRUMB_LIMIT * 2; i++) m.recordBreadcrumb(`event_${i}`);
      expect(m.readBreadcrumbs()).toHaveLength(BREADCRUMB_LIMIT);
    });
  });

  test('a ring at exactly its capacity reports every entry once', () => {
    withCaptureOn((m) => {
      m.__clearBuffers();
      for (let i = 0; i < API_LIMIT; i++) m.recordApiCall({ method: 'GET', path: `/${i}`, status: 200, durationMs: 0 });
      const paths = m.readApi().map((e) => e.path);
      expect(paths).toHaveLength(API_LIMIT);
      expect(new Set(paths).size).toBe(API_LIMIT);
    });
  });

  test('recording is a no-op when the flag is off', () => {
    // Default jest env: flag unset.
    const m = require('@/debug/buffers') as typeof import('@/debug/buffers');
    m.__clearBuffers();
    m.recordConsole('log', ['should not be kept']);
    m.recordApiCall({ method: 'GET', path: '/x', status: 200, durationMs: 1 });
    m.recordBreadcrumb('nope');
    expect(m.readConsole()).toEqual([]);
    expect(m.readApi()).toEqual([]);
    expect(m.readBreadcrumbs()).toEqual([]);
  });
});

describe('redaction actually redacts', () => {
  test('bearer tokens never survive', () => {
    const s = redact('Authorization: Bearer sk_live_abcdef1234567890abcdef');
    expect(s).not.toContain('sk_live_abcdef1234567890abcdef');
    expect(s).toContain('[REDACTED]');
  });

  test('a bare JWT is redacted wherever it appears', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyJ9.abcDEF123_-signature';
    const s = redact(`failed with token ${jwt} on retry`);
    expect(s).not.toContain(jwt);
    expect(s).toContain('[REDACTED_JWT]');
  });

  test('credential-shaped JSON fields are redacted by key', () => {
    const s = redactValue({ api_key: 'AIzaSyDEADBEEF012345678901234567890', note: 'keep me' });
    expect(s).not.toContain('AIzaSyDEADBEEF');
    expect(s).toContain('keep me');
  });

  test('Clerk and RevenueCat key shapes are redacted', () => {
    expect(redact('pk_test_Zm9vYmFyYmF6cXV4')).toContain('[REDACTED_KEY]');
    expect(redact('appl_ABCdefGHIjklMNO')).toContain('[REDACTED_KEY]');
  });

  test('a base64 image payload is dropped, not stored', () => {
    const s = redact('{"image_base64":"' + 'A'.repeat(5000) + '","meal":"lunch"}');
    expect(s).toContain('[IMAGE OMITTED]');
    expect(s).toContain('lunch');
    expect(s.length).toBeLessThan(200);
  });

  test('a token in flight does not reach the recorded API trace', () => {
    // The failure this prevents: a 401 whose error message echoes the header.
    withCaptureOn((m) => {
      m.__clearBuffers();
      m.recordApiCall({
        method: 'POST',
        path: '/api/food/logs?auth=Bearer%20sk_live_secret',
        status: 401,
        durationMs: 12,
        error: 'unauthorized: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhIn0.sig',
      });
      const dump = JSON.stringify(m.readApi());
      expect(dump).not.toContain('sk_live_secret');
      expect(dump).not.toMatch(/eyJhbGciOiJIUzI1NiJ9\.[A-Za-z0-9_-]+\.sig/);
    });
  });

  test('redactValue bounds a huge payload', () => {
    const s = redactValue({ blob: 'x'.repeat(50_000) }, 1000);
    expect(s.length).toBeLessThan(1100);
    expect(s).toContain('truncated');
  });
});

// --- the export --------------------------------------------------------------

const report = (over: Partial<DebugReport> = {}): DebugReport => ({
  id: 'r_test_1',
  createdAt: '2026-08-06T10:11:12.345Z',
  trigger: 'bubble',
  draft: false,
  title: 'Scan confidence shows red on a good photo',
  notes: 'Happened twice in a row.',
  severity: 'major',
  kind: 'bug',
  area: 'scan',
  resolution: 'open',
  screenshot: 'r_test_1.jpg',
  synced: false,
  context: {
    route: '/food/photo-capture',
    routeParams: { slot: 'Lunch' },
    appVersion: '1.0.0',
    buildNumber: '3',
    gitSha: 'abc1234',
    device: 'iPhone 15 Pro',
    osVersion: 'ios 18.2',
    screen: { width: 393, height: 852, scale: 3 },
    locale: 'en_AU',
    network: { connected: true, type: 'WIFI' },
    auth: { signedIn: true, userId: 'user_1', onboarded: true },
    entitlement: { active: false, status: null },
    console: [{ at: '2026-08-06T10:11:10.000Z', level: 'warn', text: 'slow frame' }],
    api: [{ at: '2026-08-06T10:11:11.000Z', method: 'POST', path: '/api/scan/pipeline', status: 202, durationMs: 812 }],
    breadcrumbs: [{ at: '2026-08-06T10:11:09.000Z', name: 'scan_started' }],
    storeSlice: { meals: [] },
    componentTag: 'ScanReviewCard',
  },
  ...over,
});

describe('the markdown export is well-formed and complete', () => {
  const md = reportToMarkdown(report());

  test.each([
    ['title', 'Scan confidence shows red on a good photo'],
    ['notes', 'Happened twice in a row.'],
    ['route', '/food/photo-capture'],
    ['route params', 'slot'],
    ['component tag', 'ScanReviewCard'],
    ['build', '1.0.0 (3)'],
    ['git sha', 'abc1234'],
    ['device', 'iPhone 15 Pro'],
    ['os', 'ios 18.2'],
    ['locale', 'en_AU'],
    ['screen size', '393×852'],
    ['network', 'WIFI'],
    ['auth', 'user_1'],
    ['api trace', '/api/scan/pipeline'],
    ['api status', '202'],
    ['console tail', 'slow frame'],
    ['breadcrumbs', 'scan_started'],
    ['store slice', 'meals'],
    ['screenshot', 'r_test_1.jpg'],
    ['report id', 'r_test_1'],
  ])('contains the %s', (_label, needle) => {
    expect(md).toContain(needle);
  });

  test('code fences are balanced so the paste survives', () => {
    const fences = (md.match(/```/g) ?? []).length;
    expect(fences % 2).toBe(0);
  });

  test('a pipe in a title cannot break the summary table', () => {
    const out = reportsToMarkdown([report({ title: 'a | b' })]);
    expect(out).toContain('a \\| b');
  });

  test('the document leads with a summary and only open reports', () => {
    const out = reportsToMarkdown([
      report({ id: 'a', severity: 'minor' }),
      report({ id: 'b', severity: 'blocker', title: 'Crash on launch' }),
      report({ id: 'c', resolution: 'resolved', title: 'Already fixed' }),
    ]);
    expect(out).toContain('2 open reports');
    expect(out).not.toContain('Already fixed');
    // Blockers first — the reader should hit the worst thing immediately.
    expect(out.indexOf('Crash on launch')).toBeLessThan(out.indexOf(report({ id: 'a' }).title));
  });

  test('an empty export says so rather than emitting a broken document', () => {
    expect(reportsToMarkdown([])).toContain('No open reports');
  });

  test('missing optional context degrades instead of throwing', () => {
    const bare = reportToMarkdown(
      report({
        notes: '',
        screenshot: null,
        context: { ...report().context, console: [], api: [], breadcrumbs: [], storeSlice: null, gitSha: null },
      }),
    );
    expect(bare).toContain('_none recorded_');
    expect(bare).toContain('none');
  });

  test('the JSON export round-trips', () => {
    const parsed = JSON.parse(reportsToJSON([report()])) as { exportedReports: number; reports: DebugReport[] };
    expect(parsed.exportedReports).toBe(1);
    expect(parsed.reports[0].context.api[0].path).toBe('/api/scan/pipeline');
  });
});
