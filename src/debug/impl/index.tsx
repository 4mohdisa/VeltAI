// The debug root: mounts the bubble, wires the automatic triggers, and keeps
// the route/auth/entitlement snapshots current for capture.
//
// Automatic captures are DRAFTS. They are filed silently — never a modal, never
// a blocked interaction — because they fire while the tester is mid-task and
// the point is to preserve the moment, not to interrupt it.
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useLocalSearchParams } from 'expo-router';

import { installConsoleCapture, recordApiCall, recordBreadcrumb } from '../buffers';
import { capture, setCurrentRoute } from './capture';
import { setDebugAuthSnapshot, setDebugEntitlementSnapshot } from './runtime';
import { DebugBubble, useShake, useShakeCallback } from './ui';
import { DebugScreen } from './DebugScreen';
import { syncPending } from './store';

export { DebugTag } from './ui';
export { capture } from './capture';
export { setDebugAuthSnapshot, setDebugEntitlementSnapshot } from './runtime';

/** Wired into src/lib/api.ts, which records every request through one seam. */
export const onApiCall = recordApiCall;

/** Breadcrumbs reuse the first-party analytics events (src/lib/analytics.ts)
 *  rather than maintaining a second trail that could disagree with the first. */
export const onBreadcrumb = recordBreadcrumb;

/** Wired into the ErrorBoundary. */
export function onErrorBoundary(error: Error, info?: { componentStack?: string }): void {
  void capture(
    'error-boundary',
    {
      title: `Crash: ${error.message.slice(0, 80)}`,
      notes: [error.stack, info?.componentStack].filter(Boolean).join('\n\n').slice(0, 4000),
      severity: 'blocker',
      kind: 'bug',
    },
    { draft: true },
  );
}

/** Wired into the API client's failure path (5xx and network errors). */
export function onApiFailure(method: string, path: string, status: number | null, message: string): void {
  void capture(
    'api-failure',
    {
      title: `${status ?? 'network'} on ${method} ${path}`,
      notes: message.slice(0, 2000),
      severity: status && status >= 500 ? 'major' : 'minor',
      kind: 'bug',
    },
    { draft: true },
  );
}

let rejectionHooked = false;

/** Unhandled promise rejections.
 *
 *  Hermes (the production engine) has NATIVE promises — the `promise`
 *  polyfill's tracker watches an implementation nothing uses there, so
 *  pre-audit this trigger was inert in exactly the builds the tester runs
 *  (audit 2026-08-06). Hermes exposes its own tracker; try it FIRST, and fall
 *  back to the polyfill tracker for JSC/dev runtimes. */
function installRejectionCapture(): void {
  if (rejectionHooked) return;
  rejectionHooked = true;
  const onUnhandled = (_id: number, e: unknown): void => {
    const err = e instanceof Error ? e : new Error(String(e));
    void capture(
      'unhandled-rejection',
      {
        title: `Unhandled rejection: ${err.message.slice(0, 80)}`,
        notes: (err.stack ?? '').slice(0, 4000),
        severity: 'major',
        kind: 'bug',
      },
      { draft: true },
    );
  };
  type HermesTracker = {
    enablePromiseRejectionTracker?: (o: {
      allRejections: boolean;
      onUnhandled: (id: number, e: unknown) => void;
      onHandled?: (id: number) => void;
    }) => void;
  };
  const hermes = (globalThis as { HermesInternal?: HermesTracker }).HermesInternal;
  if (hermes?.enablePromiseRejectionTracker) {
    try {
      hermes.enablePromiseRejectionTracker({ allRejections: true, onUnhandled, onHandled: () => {} });
      return;
    } catch {
      // fall through to the polyfill tracker
    }
  }
  type Tracker = { enable: (o: { allRejections: boolean; onUnhandled: (id: number, e: unknown) => void }) => void };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional RN internal, absent on some runtimes
    const tracking = require('promise/setimmediate/rejection-tracking') as Tracker;
    tracking.enable({ allRejections: true, onUnhandled });
  } catch {
    // No tracker on this runtime — the other four triggers still work.
  }
}

/** Mounted once, inside the app tree, by src/debug/index.ts. */
export function DebugRoot({
  auth,
  entitlement,
}: {
  auth: { signedIn: boolean; userId: string | null };
  entitlement: { active: boolean | null; status: string | null };
}) {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    installConsoleCapture();
    installRejectionCapture();
    void syncPending();
  }, []);

  useEffect(() => {
    setCurrentRoute(pathname ?? 'unknown', params as Record<string, unknown>);
  }, [pathname, params]);

  useEffect(() => {
    setDebugAuthSnapshot(auth);
  }, [auth]);

  useEffect(() => {
    setDebugEntitlementSnapshot(entitlement);
  }, [entitlement]);

  const onShake = useShakeCallback(pathname ?? 'unknown');
  useShake(onShake, true);

  const openList = useCallback(() => setListOpen(true), []);

  return (
    <>
      <DebugBubble route={pathname ?? 'unknown'} onOpenList={openList} />
      {listOpen ? <DebugScreen onClose={() => setListOpen(false)} /> : null}
    </>
  );
}
