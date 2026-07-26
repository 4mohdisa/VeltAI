// Offline mutation queue. When a write fails on the network (fetch rejected, not
// a server 4xx), it's queued to secure-store and replayed in order on reconnect.
// Each queued write carries a client-generated idempotency key, so a replay of a
// write that actually reached the server returns the existing row instead of a
// duplicate (backend partial unique index — see 20260718000001).
//
// ponytail: secure-store values are small (~2KB on iOS); a handful of queued food/
// gym writes fit comfortably. Move to a file/db if the queue ever grows large.
import { getItem, setItem } from '@/lib/storage/secureStore';
import { replayQueuedPost, isNetworkError } from '@/lib/api';

const STORAGE_KEY = 'lumo.offline.queue';

export type QueuedMutation = {
  id: string;
  idempotencyKey: string;
  path: string; //   e.g. '/api/food/logs'
  body: unknown;
  createdAt: number;
};

let queue: QueuedMutation[] = [];
let loaded = false;
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
 * Replay queued mutations in order, removing each on success. Stops on the first
 * error (still offline → retry later; a server error → surfaced, order preserved).
 * The idempotency key makes replaying an already-applied write a safe no-op.
 */
export async function flush(): Promise<{ flushed: number; remaining: number }> {
  await loadQueue();
  let flushed = 0;
  while (queue.length > 0) {
    const m = queue[0];
    try {
      await replayQueuedPost(m.path, m.body, m.idempotencyKey);
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
  listeners.clear();
  await persist();
}

/** Test helper — drop in-memory state only (simulates an app restart; the
 *  persisted queue survives and rehydrates on the next loadQueue). */
export function __resetMemoryForTests(): void {
  queue = [];
  loaded = false;
  listeners.clear();
}
