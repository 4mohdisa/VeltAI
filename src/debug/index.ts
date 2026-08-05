// The ONLY module shipping code imports from.
//
// Two layers of gating:
//   1. metro.config.js resolves './impl' to './stub' when the flag is off, so
//      the debug UI is not in a production bundle at all.
//   2. DEBUG_CAPTURE is a build-time constant here too, so even if the resolver
//      rule were removed, every entry point still short-circuits.
//
// Callers never branch on the flag themselves — they call these and get a
// no-op in production.
import { DEBUG_CAPTURE } from './flag';
import * as impl from '@/debug/impl';

export { DEBUG_CAPTURE } from './flag';
export type { DebugReport, ReportInput, Severity, Kind, Area, Trigger } from './types';

/** The debug overlay. Renders nothing unless the flag is on. */
export const DebugRoot = impl.DebugRoot;

/** Wrap a component under test so reports raised while it is on screen carry
 *  its name. A transparent passthrough in production. */
export const DebugTag = impl.DebugTag;

/** Record one API call. Called from src/lib/api.ts — the one seam every
 *  request goes through — and free when the flag is off. */
export const recordApiCall = DEBUG_CAPTURE ? impl.onApiCall : () => undefined;

/** Record one analytics event as a breadcrumb. Free when the flag is off. */
export const recordBreadcrumb = DEBUG_CAPTURE ? impl.onBreadcrumb : () => undefined;

/** Auto-file a draft on an API 5xx or network failure. */
export const reportApiFailure = DEBUG_CAPTURE ? impl.onApiFailure : () => undefined;

/** Auto-file a draft when the ErrorBoundary catches. */
export const reportCrash = DEBUG_CAPTURE ? impl.onErrorBoundary : () => undefined;

export const setDebugAuthSnapshot = DEBUG_CAPTURE ? impl.setDebugAuthSnapshot : () => undefined;
export const setDebugEntitlementSnapshot = DEBUG_CAPTURE ? impl.setDebugEntitlementSnapshot : () => undefined;
