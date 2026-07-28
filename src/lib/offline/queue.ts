// Offline mutation queue. When a write fails on the network (fetch rejected, not
// a server 4xx), it's queued to secure-store and replayed in order on reconnect.
// Each queued write carries a client-generated idempotency key, so a replay of a
// write that actually reached the server returns the existing row instead of a
// duplicate (backend partial unique index — see 20260718000001).
//
// ponytail: secure-store values are small (~2KB on iOS); a handful of queued food/
// gym writes fit comfortably. Move to a file/db if the queue ever grows large.
import { getItem, setItem } from '@/lib/storage/secureStore';
import { ApiError, replayQueuedPost, isNetworkError } from '@/lib/api';

const STORAGE_KEY = 'lumo.offline.queue';

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

let seq = 0;
function genId(): string {
  return `${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function notify(): void {
  for (const l of listeners) l(queue.length);
}

async function persist(): Promise<void> {
  await setItem(STORAGE_KEY, JSON.stringify(queue));
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
    // No id to address the steps with — permanent (an ApiError, so it is never
    // mistaken for "still offline" and retried forever).
    if (steps.length > 0 && !id) throw new ApiError(502, 'sequenced create returned no id');
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
 * Try a write now; on a NETWORK failure, queue it (with a fresh idempotency key)
 * and resolve null. A server error (4xx/5xx) is permanent — it re-throws.
 */
export async function runOrQueue<T>(path: string, body: unknown): Promise<T | null> {
  const key = genId();
  try {
    return await replayQueuedPost<T>(path, body, key);
  } catch (e) {
    if (isNetworkError(e)) {
      await enqueue(path, body, key);
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
    if (!isNetworkError(e)) throw e;
    await loadQueue();
    queue.push(m); // carries whatever progress runUnit made
    await persist();
    notify();
  }
}

/**
 * Replay queued mutations in order, removing each on success. Stops on the first
 * error (still offline → retry later; a server error → surfaced, order preserved).
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
  while (queue.length > 0) {
    const m = queue[0];
    try {
      await runUnit(m);
    } catch {
      break;
    }
    queue.shift();
    flushed++;
    await persist();
    notify();
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
