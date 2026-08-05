// Report persistence. LOCAL FIRST, always.
//
// A report is written to the filesystem — index entry and screenshot — before
// any network call is attempted. The whole point of this system is that the
// tester is alone with a phone for a week or two: a report lost because the
// backend was unreachable, or because the app crashed right after capture, is
// the one report that mattered. Sync is a secondary copy, best-effort, and
// never blocks the UI.
// The legacy API (documentDirectory/readAsStringAsync) is still shipped in
// SDK 56 and is a much smaller surface than the new File/Directory classes for
// what this needs. Revisit if it is removed.
import * as FileSystem from 'expo-file-system/legacy';

import { api } from '@/lib/api';
import type { DebugReport, Resolution } from '../types';

const DIR = `${FileSystem.documentDirectory}debug-reports/`;
const INDEX = `${DIR}index.json`;

/** Hard cap on local storage. Screenshots dominate; ~200 KB each at quality
 *  0.6, so this is a few hundred reports. Oldest RESOLVED reports are pruned
 *  first — an open report is never dropped to make room for a new one unless
 *  there is nothing resolved left to drop. */
export const MAX_BYTES = 64 * 1024 * 1024;

let cache: DebugReport[] | null = null;
const listeners = new Set<(r: DebugReport[]) => void>();

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

export async function loadReports(): Promise<DebugReport[]> {
  if (cache) return cache;
  try {
    await ensureDir();
    const info = await FileSystem.getInfoAsync(INDEX);
    if (!info.exists) {
      cache = [];
      return cache;
    }
    const raw = await FileSystem.readAsStringAsync(INDEX);
    const parsed = JSON.parse(raw) as unknown;
    cache = Array.isArray(parsed) ? (parsed as DebugReport[]) : [];
  } catch {
    // A corrupt index must not brick capture — start clean rather than throw.
    cache = [];
  }
  return cache;
}

async function persist(reports: DebugReport[]): Promise<void> {
  cache = reports;
  await ensureDir();
  await FileSystem.writeAsStringAsync(INDEX, JSON.stringify(reports));
  listeners.forEach((l) => l(reports));
}

export function subscribeReports(fn: (r: DebugReport[]) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const reportsDir = (): string => DIR;
export const screenshotUri = (name: string): string => `${DIR}${name}`;

/** Write a screenshot that a capture has already produced into the reports
 *  directory, and return its bare filename. */
export async function saveScreenshot(tmpUri: string, id: string): Promise<string | null> {
  try {
    await ensureDir();
    const name = `${id}.jpg`;
    await FileSystem.copyAsync({ from: tmpUri, to: `${DIR}${name}` });
    return name;
  } catch {
    return null; // a missing screenshot must never lose the report
  }
}

/** Add a report. Written to disk before this resolves. */
export async function addReport(report: DebugReport): Promise<void> {
  const reports = [report, ...(await loadReports())];
  await persist(reports);
  await pruneIfNeeded();
}

export async function updateReport(id: string, patch: Partial<DebugReport>): Promise<void> {
  const reports = (await loadReports()).map((r) => (r.id === id ? { ...r, ...patch } : r));
  await persist(reports);
}

export async function setResolution(id: string, resolution: Resolution): Promise<void> {
  await updateReport(id, { resolution });
}

export async function deleteReport(id: string): Promise<void> {
  const reports = await loadReports();
  const gone = reports.find((r) => r.id === id);
  if (gone?.screenshot) {
    await FileSystem.deleteAsync(`${DIR}${gone.screenshot}`, { idempotent: true }).catch(() => undefined);
  }
  await persist(reports.filter((r) => r.id !== id));
}

/** Total bytes used by screenshots plus the index. */
async function usedBytes(): Promise<number> {
  const reports = await loadReports();
  let total = JSON.stringify(reports).length;
  for (const r of reports) {
    if (!r.screenshot) continue;
    const info = await FileSystem.getInfoAsync(`${DIR}${r.screenshot}`);
    if (info.exists && !info.isDirectory) total += info.size ?? 0;
  }
  return total;
}

/** Drop oldest RESOLVED reports until under the cap; only then oldest others. */
export async function pruneIfNeeded(): Promise<number> {
  if ((await usedBytes()) <= MAX_BYTES) return 0;
  const reports = await loadReports();
  const droppable = [
    ...reports.filter((r) => r.resolution !== 'open').sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    ...reports.filter((r) => r.resolution === 'open').sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  ];
  let dropped = 0;
  for (const r of droppable) {
    if ((await usedBytes()) <= MAX_BYTES) break;
    await deleteReport(r.id);
    dropped++;
  }
  return dropped;
}

/** Best-effort secondary copy. Never throws, never blocks a caller. */
export async function syncReport(report: DebugReport): Promise<boolean> {
  try {
    let imageBase64: string | undefined;
    if (report.screenshot) {
      imageBase64 = await FileSystem.readAsStringAsync(`${DIR}${report.screenshot}`, {
        encoding: FileSystem.EncodingType.Base64,
      }).catch(() => undefined);
    }
    await api.debugReports.create({
      client_id: report.id,
      created_at: report.createdAt,
      title: report.title,
      notes: report.notes,
      severity: report.severity,
      kind: report.kind,
      area: report.area,
      trigger: report.trigger,
      route: report.context.route,
      app_version: report.context.appVersion,
      build_number: report.context.buildNumber,
      context: report.context as unknown as Record<string, unknown>,
      ...(imageBase64 ? { image_base64: imageBase64 } : {}),
    });
    await updateReport(report.id, { synced: true });
    return true;
  } catch {
    return false;
  }
}

/** Push everything not yet synced. Fire-and-forget from the UI. */
export async function syncPending(): Promise<number> {
  const pending = (await loadReports()).filter((r) => !r.synced && !r.draft);
  let ok = 0;
  for (const r of pending) {
    if (await syncReport(r)) ok++;
  }
  return ok;
}

/** Tests only. */
export function __resetStoreCache(): void {
  cache = null;
}
