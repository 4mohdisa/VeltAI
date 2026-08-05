// What `src/debug/impl` resolves to when EXPO_PUBLIC_DEBUG_CAPTURE is not '1'.
//
// metro.config.js rewrites the resolution, so in a production build the real
// implementation — the UI, the screenshot dependency, the report store — is not
// in the module graph at all. Not hidden behind a conditional: absent.
//
// Every export here matches impl's surface and does nothing. They exist so the
// call sites in shipping code (src/lib/api.ts, the ErrorBoundary) do not need
// their own conditionals.

/* eslint-disable @typescript-eslint/no-unused-vars */

export const DebugRoot = (_props: unknown): null => null;

/** Passthrough: <DebugTag> must render its children in production. */
export const DebugTag = ({ children }: { name: string; children: unknown }): unknown => children;

export const onApiCall = (_e: unknown): void => undefined;
export const onBreadcrumb = (_n: string, _p?: unknown): void => undefined;
export const onApiFailure = (_m: string, _p: string, _s: number | null, _msg: string): void => undefined;
export const onErrorBoundary = (_e: Error, _info?: unknown): void => undefined;
export const capture = async (): Promise<null> => null;
export const setDebugAuthSnapshot = (_s: unknown): void => undefined;
export const setDebugEntitlementSnapshot = (_s: unknown): void => undefined;
