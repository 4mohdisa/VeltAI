// Bounded evidence trails: console lines, API calls, and breadcrumbs.
//
// These are plain ring buffers with a hard cap, allocated once. They must never
// grow: this runs for a week or two of real use on a real phone, and an
// unbounded log is a memory leak that would itself become the bug being hunted.
//
// This module is imported by src/lib/api.ts, which is NOT debug-gated, so it
// must be safe (and near-free) when the flag is off. Every recorder no-ops
// unless DEBUG_CAPTURE is true.
import { DEBUG_CAPTURE } from './flag';

export const CONSOLE_LIMIT = 50;
export const API_LIMIT = 20;
export const BREADCRUMB_LIMIT = 20;

export type ConsoleEntry = { at: string; level: 'log' | 'warn' | 'error' | 'info' | 'debug'; text: string };
export type ApiEntry = {
  at: string;
  method: string;
  path: string;
  status: number | null;
  durationMs: number;
  error?: string;
};
export type Breadcrumb = { at: string; name: string; props?: Record<string, unknown> };

/** Fixed-capacity ring. push() is O(1) and never allocates after construction. */
class Ring<T> {
  private buf: (T | undefined)[];
  private next = 0;
  private filled = false;
  constructor(readonly cap: number) {
    this.buf = new Array<T | undefined>(cap);
  }
  push(v: T): void {
    this.buf[this.next] = v;
    this.next = (this.next + 1) % this.cap;
    if (this.next === 0) this.filled = true;
  }
  /** Oldest → newest. */
  toArray(): T[] {
    const out = this.filled ? [...this.buf.slice(this.next), ...this.buf.slice(0, this.next)] : this.buf.slice(0, this.next);
    return out.filter((v): v is T => v !== undefined);
  }
  clear(): void {
    this.buf = new Array<T | undefined>(this.cap);
    this.next = 0;
    this.filled = false;
  }
  get size(): number {
    return this.filled ? this.cap : this.next;
  }
}

const consoleRing = new Ring<ConsoleEntry>(CONSOLE_LIMIT);
const apiRing = new Ring<ApiEntry>(API_LIMIT);
const crumbRing = new Ring<Breadcrumb>(BREADCRUMB_LIMIT);

// --- redaction ---------------------------------------------------------------

// Anything matching these is replaced before it is ever written to disk. The
// reports are exported and pasted into a chat window, so a leaked bearer token
// would travel a long way. Order matters: the more specific patterns run first.
const REDACTIONS: [RegExp, string][] = [
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, '$1 [REDACTED]'],
  // JWTs anywhere, even bare.
  [/\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]'],
  // key/token/secret/password/authorization in JSON or query form.
  [
    /("?\b(?:authorization|auth|token|access_token|refresh_token|id_token|api[-_]?key|secret|password|passwd|pwd|session|cookie)\b"?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,&}\]]+)/gi,
    '$1[REDACTED]',
  ],
  // Long opaque keys (Clerk pk_/sk_, RevenueCat appl_, Google AIza…).
  [/\b(?:sk|pk|rk)_[A-Za-z0-9_-]{8,}/g, '[REDACTED_KEY]'],
  [/\bappl_[A-Za-z0-9]{8,}/g, '[REDACTED_KEY]'],
  [/\bAIza[A-Za-z0-9_-]{20,}/g, '[REDACTED_KEY]'],
  // base64 image payloads — huge and useless in a log.
  [/"image_base64"\s*:\s*"[^"]*"/g, '"image_base64":"[IMAGE OMITTED]"'],
];

/** Strip credentials from any string bound for a report. */
export function redact(input: string): string {
  let s = input;
  for (const [re, to] of REDACTIONS) s = s.replace(re, to);
  return s;
}

/** Deep-redact an OBJECT, returning an object again where possible (falls back
 *  to the redacted string when truncation/redaction breaks the JSON). For
 *  report fields that render structurally: routeParams, store slices. */
export function redactObject(v: unknown, maxChars = 4000): unknown {
  const s = redactValue(v, maxChars);
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return s;
  }
}

/** Deep-redact a value, bounded so a huge object cannot blow up a report. */
export function redactValue(v: unknown, maxChars = 4000): string {
  let s: string;
  try {
    s = typeof v === 'string' ? v : JSON.stringify(v, replacer);
  } catch {
    s = String(v);
  }
  if (s === undefined) s = String(v);
  s = redact(s);
  return s.length > maxChars ? `${s.slice(0, maxChars)}… [truncated ${s.length - maxChars} chars]` : s;
}

// Drop obviously sensitive keys wholesale rather than relying on the regexes.
const SENSITIVE_KEY = /^(authorization|token|access_token|refresh_token|id_token|api_?key|secret|password|cookie|session)$/i;
function replacer(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return '[REDACTED]';
  return value;
}

// --- recorders ---------------------------------------------------------------

const now = () => new Date().toISOString();

export function recordConsole(level: ConsoleEntry['level'], parts: unknown[]): void {
  if (!DEBUG_CAPTURE) return;
  consoleRing.push({ at: now(), level, text: redactValue(parts.map((p) => redactValue(p, 500)).join(' '), 1000) });
}

/** Called from the ONE place every request goes through (src/lib/api.ts). */
export function recordApiCall(e: Omit<ApiEntry, 'at'>): void {
  if (!DEBUG_CAPTURE) return;
  apiRing.push({
    at: now(),
    method: e.method,
    path: redact(e.path),
    status: e.status,
    durationMs: Math.round(e.durationMs),
    ...(e.error ? { error: redactValue(e.error, 500) } : {}),
  });
}

/** Breadcrumbs reuse the first-party analytics events — one trail, not two. */
export function recordBreadcrumb(name: string, props?: Record<string, unknown>): void {
  if (!DEBUG_CAPTURE) return;
  let clean: Record<string, unknown> | undefined;
  if (props) {
    try {
      clean = JSON.parse(redactValue(props)) as Record<string, unknown>;
    } catch {
      // Redaction output is not always JSON: [REDACTED] lands unquoted and
      // truncation appends a suffix. Pre-audit the JSON.parse throw travelled
      // back into track(), silently dropping the analytics event itself
      // whenever a prop matched a redaction pattern (audit 2026-08-06).
      clean = Object.fromEntries(Object.entries(props).map(([k, v]) => [k, redactValue(v, 200)]));
    }
  }
  crumbRing.push({ at: now(), name, ...(clean ? { props: clean } : {}) });
}

export const readConsole = (): ConsoleEntry[] => consoleRing.toArray();
export const readApi = (): ApiEntry[] => apiRing.toArray();
export const readBreadcrumbs = (): Breadcrumb[] => crumbRing.toArray();

/** Tests only. */
export function __clearBuffers(): void {
  consoleRing.clear();
  apiRing.clear();
  crumbRing.clear();
}

// --- console interception ----------------------------------------------------

let installed = false;

/** Wrap console.* once at startup so the ring fills without any call sites
 *  changing. The originals are still called, so dev logging is unaffected. */
export function installConsoleCapture(): void {
  if (!DEBUG_CAPTURE || installed) return;
  installed = true;
  const levels: ConsoleEntry['level'][] = ['log', 'warn', 'error', 'info', 'debug'];
  for (const level of levels) {
    const original = console[level] as (...args: unknown[]) => void;
    if (typeof original !== 'function') continue;
    console[level] = ((...args: unknown[]) => {
      try {
        recordConsole(level, args);
      } catch {
        // Capturing a log must never break the log itself.
      }
      original(...args);
    }) as typeof console.log;
  }
}
