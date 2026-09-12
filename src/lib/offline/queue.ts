// Offline mutation queue. When a write fails on the network (fetch rejected, not
// a server 4xx), it's queued to secure-store and replayed in order on reconnect.
// Each queued write carries a client-generated idempotency key, so a replay of a
// write that actually reached the server returns the existing row instead of a
// duplicate (backend partial unique index — see 20260718000001).
//
// Size (measured 2026-09-12, the real persisted shapes): one queued food write
// is ~286 bytes and one gym write ~369 (with its exercise steps), so 10 queued
// writes are ~3.1KB, 50 are ~15KB and 100 are ~31KB. The "~2KB" figure this
// comment used to quote was Expo's OLD Android warning; expo-secure-store 56.0.4
// validates no size on either platform, and an iOS Keychain item holds tens of KB
// without complaint. So a realistic backlog — even a week offline — fits, and
// there is no cap or compaction here on purpose.
//
// What is NOT safe to assume is that the write landed: the Keychain can refuse
// (locked device during a background flush, storage full, or an encryption key
// invalidated by a reinstall). persist() therefore checks, because a queue that
// silently failed to persist loses every queued write on the next launch.
import { getItem, setItem } from '@/lib/storage/secureStore';
import { ApiError, replayQueuedPost, isTransient } from '@/lib/api';
import { showToast } from '@/components/display/toastStore';

const STORAGE_KEY = 'lume.offline.queue';

/** A follow-up POST in a sequenced unit. `{id}` in the path is replaced by the id
 *  the unit's first POST returned. */
export type QueuedStep = { path: string; body?: unknown };

export type QueuedMutation = {
  id: string;
  idempotencyKey: string;
  path: string; //   e.g. '/api/food/logs'
  body: unknown;
  createdAt: number;
  // --- sequenced unit (gym: create session → add exercises → complete) ---
  /** Steps that run, in order, only after the first POST succeeded. */
  steps?: QueuedStep[];
  /** Resume state, persisted after the create and after every step: a retry never
   *  re-creates the row and never re-runs a step that already landed. */
  serverId?: string;
  doneSteps?: number;
};

let queue: QueuedMutation[] = [];
let loaded = false;
let flushing: Promise<{ flushed: number; remaining: number }> | null = null;
const listeners = new Set<(count: number) => void>();

// Mutation id → "the server finally took it, here is the row" callback, so an
// optimistic local row can swap in the server id when a queued create lands
// (without it, hydration would show the local row AND the server row).
// ponytail: in-memory only, deliberately. The stores it patches are in-session
// too (foodStore has no cross-restart persistence), so after a restart there is
// no local row left to reconcile — the replay just creates the server row.
const landedCallbacks = new Map<string, (row: unknown) => void>();

let seq = 0;
function genId(): string {
  return `${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function notify(): void {
  for (const l of listeners) l(queue.length);
}

let warnedPersistFailed = false;

async function persist(): Promise<void> {
  if (await setItem(STORAGE_KEY, JSON.stringify(queue))) {
    warnedPersistFailed = false;
    return;
  }
  // Once per run of failures: the writes are still in memory and will still be
  // sent this session, but telling the user nothing would be a lie by omission.
  if (!warnedPersistFailed) {
    warnedPersistFailed = true;
    console.warn(`[offline] could not persist ${queue.length} queued write(s) — they will not survive a restart`);
    showToast({
      message: "Couldn't save your offline changes to this device. They'll still sync while the app is open.",
      tone: 'error',
    });
  }
}

/** Hydrate the queue from secure-store (once). Safe to call repeatedly. */
export async function loadQueue(): Promise<void> {
  if (loaded) return;
  loaded = true;
  const raw = await getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) queue = parsed as QueuedMutation[];
    } catch {
      queue = []; // corrupt payload → start clean
    }
  }
  notify();
}

/** Append a mutation and persist it. Reuses the given key if provided. */
export async function enqueue(path: string, body: unknown, idempotencyKey?: string): Promise<QueuedMutation> {
  await loadQueue();
  const m: QueuedMutation = {
    id: genId(),
    idempotencyKey: idempotencyKey ?? genId(),
    path,
    body,
    createdAt: Date.now(),
  };
  queue.push(m);
  await persist();
  notify();
  return m;
}

/**
 * Run a unit from wherever it left off: the create (at most once), then each
 * remaining step against the id the create returned. Every step shares the unit's
 * idempotency key, so a replayed create is a no-op returning the existing row.
 * Progress is persisted as it goes, so a restart or a second flush resumes here.
 *
 * ponytail: only sessions/food_logs have the dedup index; the exercise/complete
 * endpoints rely on `doneSteps` alone — a step whose response was lost re-posts.
 * Add an idempotency_key to gym_exercises if duplicate exercises ever show up.
 */
async function runUnit(m: QueuedMutation): Promise<unknown> {
  const steps = m.steps ?? [];
  let created: unknown;
  if (m.serverId === undefined) {
    created = await replayQueuedPost<{ id?: string } | null>(m.path, m.body, m.idempotencyKey);
    const id = (created as { id?: string } | null)?.id;
    // No id to address the steps with — permanent. 422, not 5xx: isTransient()
    // must NOT classify this as "try again later" or it would requeue forever.
    if (steps.length > 0 && !id) throw new ApiError(422, 'sequenced create returned no id');
    m.serverId = id ?? '';
    if (steps.length > 0) await persist();
  }
  for (let i = m.doneSteps ?? 0; i < steps.length; i++) {
    await replayQueuedPost(steps[i].path.replace('{id}', m.serverId), steps[i].body, m.idempotencyKey);
    m.doneSteps = i + 1;
    await persist();
  }
  return created;
}

/**
 * Try a write now; on a TRANSIENT failure (offline, timeout, 5xx from a proxy or
 * a restarting backend, 429), queue it with its idempotency key and resolve null.
 * Only a permanent 4xx re-throws — replaying that would fail identically forever.
 */
export async function runOrQueue<T>(path: string, body: unknown, onLanded?: (row: T) => void): Promise<T | null> {
  const key = genId();
  try {
    return await replayQueuedPost<T>(path, body, key);
  } catch (e) {
    if (isTransient(e)) {
      const m = await enqueue(path, body, key);
      if (onLanded) landedCallbacks.set(m.id, onLanded as (row: unknown) => void);
      return null;
    }
    throw e;
  }
}

/**
 * Like runOrQueue, but for a multi-step sequence that must stay one ordered unit
 * (gym: create session → add exercises → complete). Queued as a single entry with
 * one shared idempotency key, so a half-run sequence resumes at the right step and
 * can never create a second session.
 */
export async function runOrQueueSequence(path: string, body: unknown, steps: QueuedStep[]): Promise<void> {
  const m: QueuedMutation = { id: genId(), idempotencyKey: genId(), path, body, createdAt: Date.now(), steps };
  try {
    await runUnit(m);
  } catch (e) {
    if (!isTransient(e)) throw e;
    await loadQueue();
    queue.push(m); // carries whatever progress runUnit made
    await persist();
    notify();
  }
}

/**
 * Replay queued mutations in order, removing each on success. A TRANSIENT
 * failure stops the run (still offline → retry on the next flush, order
 * preserved). A PERMANENT 4xx is dropped with a toast: replaying it would fail
 * identically forever, and pre-audit it sat at the head of the queue blocking
 * every mutation behind it for the rest of time (audit 2026-08-06).
 * The idempotency key makes replaying an already-applied write a safe no-op.
 * Concurrent callers (reconnect + foreground can fire together) share one run.
 */
export function flush(): Promise<{ flushed: number; remaining: number }> {
  if (!flushing) {
    flushing = runFlush().finally(() => {
      flushing = null;
    });
  }
  return flushing;
}

async function runFlush(): Promise<{ flushed: number; remaining: number }> {
  await loadQueue();
  let flushed = 0;
  let dropped = 0;
  while (queue.length > 0) {
    const m = queue[0];
    let created: unknown;
    try {
      created = await runUnit(m);
    } catch (e) {
      if (isTransient(e)) break; // offline / server down — retry next flush
      // Permanent rejection: drop the poison mutation so everything queued
      // behind it can still sync, and tell the user instead of pretending.
      landedCallbacks.delete(m.id);
      queue.shift();
      dropped++;
      await persist();
      notify();
      continue;
    }
    const landed = landedCallbacks.get(m.id);
    if (landed) {
      landedCallbacks.delete(m.id);
      landed(created);
    }
    queue.shift();
    flushed++;
    await persist();
    notify();
  }
  if (dropped > 0) {
    showToast({
      message: dropped === 1 ? "A queued change couldn't sync and was discarded." : `${dropped} queued changes couldn't sync and were discarded.`,
      tone: 'error',
    });
  }
  return { flushed, remaining: queue.length };
}

/** Current queue depth (for the "N pending" indicator). */
export function pendingCount(): number {
  return queue.length;
}

/** Subscribe to queue-depth changes; fires immediately with the current count. */
export function subscribe(listener: (count: number) => void): () => void {
  listeners.add(listener);
  listener(queue.length);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper — reset in-memory + persisted state. */
export async function __resetForTests(): Promise<void> {
  queue = [];
  loaded = false;
  flushing = null;
  listeners.clear();
  landedCallbacks.clear();
  await persist();
}

/** Test helper — drop in-memory state only (simulates an app restart; the
 *  persisted queue survives and rehydrates on the next loadQueue). */
export function __resetMemoryForTests(): void {
  queue = [];
  loaded = false;
  flushing = null;
  listeners.clear();
}
