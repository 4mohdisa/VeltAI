/// <reference types="jest" />
/// <reference types="node" />
// Local-first persistence: a report must survive a crash and a restart before
// it is ever synced. This is the property the whole system rests on — the
// tester is alone with a phone for a week, and a report lost because the
// backend was unreachable is the one report that mattered.
//
// expo-file-system is mocked with an in-memory filesystem so the store's real
// logic (index round-trip, prune order, sync marking) is exercised rather than
// stubbed. `jest.isolateModules` stands in for an app restart: the module
// cache — and with it the in-memory cache — is thrown away, exactly as a
// relaunch does, while the "disk" survives.
const mockDisk = new Map<string, string>();
const mockSizes = new Map<string, number>();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
  getInfoAsync: jest.fn(async (uri: string) => {
    if (uri.endsWith('/')) return { exists: true, isDirectory: true };
    const exists = mockDisk.has(uri);
    return { exists, isDirectory: false, size: mockSizes.get(uri) ?? (mockDisk.get(uri)?.length ?? 0) };
  }),
  makeDirectoryAsync: jest.fn(async () => undefined),
  readAsStringAsync: jest.fn(async (uri: string) => {
    const v = mockDisk.get(uri);
    if (v === undefined) throw new Error('ENOENT');
    return v;
  }),
  writeAsStringAsync: jest.fn(async (uri: string, body: string) => {
    mockDisk.set(uri, body);
  }),
  copyAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
    mockDisk.set(to, mockDisk.get(from) ?? 'JPEGDATA');
    mockSizes.set(to, mockSizes.get(from) ?? 8);
  }),
  deleteAsync: jest.fn(async (uri: string) => {
    mockDisk.delete(uri);
    mockSizes.delete(uri);
  }),
}));

const mockCreate = jest.fn(async () => ({ id: 'server_1' }));
jest.mock('@/lib/api', () => ({ api: { debugReports: { create: (...a: unknown[]) => mockCreate(...(a as [])) } } }));

import type { DebugReport } from '@/debug/types';

type StoreModule = typeof import('@/debug/impl/store');

/** Fresh module instance — the equivalent of relaunching the app. */
async function freshStore(): Promise<StoreModule> {
  let m!: StoreModule;
  jest.isolateModules(() => {
    m = require('@/debug/impl/store') as StoreModule;
  });
  return m;
}

const report = (over: Partial<DebugReport> = {}): DebugReport =>
  ({
    id: 'r_1',
    createdAt: '2026-08-06T10:00:00.000Z',
    trigger: 'bubble',
    draft: false,
    title: 'A report',
    notes: '',
    severity: 'minor',
    kind: 'bug',
    area: 'scan',
    resolution: 'open',
    screenshot: null,
    synced: false,
    context: { route: '/x' },
    ...over,
  }) as unknown as DebugReport;

beforeEach(() => {
  mockDisk.clear();
  mockSizes.clear();
  mockCreate.mockClear();
});

describe('a report survives an app restart before sync', () => {
  test('it is on disk immediately, and reloads after a restart', async () => {
    const first = await freshStore();
    await first.addReport(report({ id: 'r_survive', title: 'Crash on scan' }));

    // Written before any network attempt: the "disk" has it now.
    expect([...mockDisk.keys()].some((k) => k.endsWith('index.json'))).toBe(true);

    // Restart: new module instance, empty in-memory cache, same disk.
    const afterRestart = await freshStore();
    const loaded = await afterRestart.loadReports();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].title).toBe('Crash on scan');
    expect(loaded[0].synced).toBe(false);
  });

  test('the screenshot survives with it', async () => {
    mockDisk.set('file:///tmp/shot.jpg', 'JPEGDATA');
    const m = await freshStore();
    const name = await m.saveScreenshot('file:///tmp/shot.jpg', 'r_shot');
    expect(name).toBe('r_shot.jpg');
    await m.addReport(report({ id: 'r_shot', screenshot: name }));

    const afterRestart = await freshStore();
    const [r] = await afterRestart.loadReports();
    expect(r.screenshot).toBe('r_shot.jpg');
    expect(mockDisk.has(`file:///docs/debug-reports/${r.screenshot}`)).toBe(true);
  });

  test('a corrupt index starts clean rather than bricking capture', async () => {
    mockDisk.set('file:///docs/debug-reports/index.json', '{ this is not json');
    const m = await freshStore();
    await expect(m.loadReports()).resolves.toEqual([]);
    // And capture still works afterwards.
    await m.addReport(report({ id: 'r_after' }));
    expect(await m.loadReports()).toHaveLength(1);
  });

  test('a failed sync leaves the report intact and unsynced', async () => {
    mockCreate.mockRejectedValueOnce(new Error('offline'));
    const m = await freshStore();
    const r = report({ id: 'r_offline' });
    await m.addReport(r);
    expect(await m.syncReport(r)).toBe(false);

    const afterRestart = await freshStore();
    const [loaded] = await afterRestart.loadReports();
    expect(loaded.id).toBe('r_offline');
    expect(loaded.synced).toBe(false);
  });

  test('a successful sync marks it, and the mark survives a restart', async () => {
    const m = await freshStore();
    const r = report({ id: 'r_sync' });
    await m.addReport(r);
    expect(await m.syncReport(r)).toBe(true);

    const afterRestart = await freshStore();
    const [loaded] = await afterRestart.loadReports();
    expect(loaded.synced).toBe(true);
  });

  test('syncPending skips drafts — an auto-capture is not pushed until promoted', async () => {
    const m = await freshStore();
    await m.addReport(report({ id: 'r_draft', draft: true }));
    await m.addReport(report({ id: 'r_real', draft: false }));
    await m.syncPending();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

describe('storage is bounded, and prunes resolved reports first', () => {
  test('an oldest RESOLVED report is dropped before any open one', async () => {
    const m = await freshStore();
    // Each screenshot is reported as huge so the cap is crossed immediately.
    const big = (id: string, over: Partial<DebugReport>) => {
      mockDisk.set(`file:///docs/debug-reports/${id}.jpg`, 'X');
      mockSizes.set(`file:///docs/debug-reports/${id}.jpg`, 40 * 1024 * 1024);
      return report({ id, screenshot: `${id}.jpg`, ...over });
    };
    await m.addReport(big('r_open_old', { createdAt: '2026-08-01T00:00:00.000Z', resolution: 'open' }));
    await m.addReport(big('r_done_old', { createdAt: '2026-08-02T00:00:00.000Z', resolution: 'resolved' }));

    const ids = (await m.loadReports()).map((r) => r.id);
    // The resolved one goes even though the open one is older.
    expect(ids).toContain('r_open_old');
    expect(ids).not.toContain('r_done_old');
  });
});
