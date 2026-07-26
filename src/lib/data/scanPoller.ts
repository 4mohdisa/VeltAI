// Interim scan-status transport: poll GET /api/food/logs/:id until the async
// pipeline flips the row to 'ready' (or 'failed'). This stands in for Supabase
// realtime (see realtime.ts, a no-op seam until @supabase/supabase-js is
// installed) — activating realtime later replaces this with a single-file
// change there; the poller is the correct, dependency-free interim solution.
import { api, type FoodLog } from '@/lib/api';

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 60_000;

/**
 * Poll a scan food_log until it becomes 'ready' or 'failed'. Returns a stop()
 * to cancel (call on unmount / after save/discard). Guarantees: no callback
 * fires after stop(); exactly one terminal callback fires (onReady OR onFailed);
 * the 60s timeout invokes onFailed once; transient fetch errors keep polling
 * until the deadline.
 */
export function startScanPoller(
  logId: string,
  onReady: (log: FoodLog) => void,
  onFailed: () => void,
): () => void {
  let stopped = false;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;

  const stop = (): void => {
    stopped = true;
    if (pollTimer) clearTimeout(pollTimer);
    if (deadlineTimer) clearTimeout(deadlineTimer);
  };

  const finishFailed = (): void => {
    if (stopped) return;
    stop();
    onFailed();
  };

  deadlineTimer = setTimeout(finishFailed, TIMEOUT_MS);

  const poll = (): void => {
    if (stopped) return;
    api.foodLogs
      .get(logId)
      .then((log) => {
        if (stopped) return;
        if (log.status === 'ready') {
          stop();
          onReady(log);
        } else if (log.status === 'failed') {
          finishFailed();
        } else {
          pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      })
      .catch(() => {
        // Transient error (backend momentarily unreachable) — keep polling
        // until the deadline rather than failing early.
        if (stopped) return;
        pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
      });
  };

  // First poll after one interval — the pipeline needs a beat to run.
  pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
  return stop;
}
