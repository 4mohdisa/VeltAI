// The shape of a captured report. Kept in its own module (not behind the
// impl/stub alias) so the stub, the store and the exporter can all agree on it
// without dragging the implementation into a production bundle: types are
// erased at build time.
import type { ApiEntry, Breadcrumb, ConsoleEntry } from './buffers';

export type Severity = 'blocker' | 'major' | 'minor' | 'cosmetic';
export type Kind = 'bug' | 'ux' | 'copy' | 'performance' | 'idea';
export type Resolution = 'open' | 'resolved' | 'wontfix' | 'duplicate';

/** Why the report exists. Automatic ones are filed as drafts and must never
 *  interrupt what the tester is doing. */
export type Trigger = 'shake' | 'bubble' | 'error-boundary' | 'unhandled-rejection' | 'api-failure';

export const SEVERITIES: Severity[] = ['blocker', 'major', 'minor', 'cosmetic'];
export const KINDS: Kind[] = ['bug', 'ux', 'copy', 'performance', 'idea'];

/** The real feature areas, used for the picker and auto-fill from the route. */
export const AREAS = [
  'scan',
  'food log',
  'gym',
  'onboarding',
  'paywall',
  'insights',
  'settings',
  'dashboard',
  'energy',
  'auth',
  'other',
] as const;
export type Area = (typeof AREAS)[number];

/** Everything captured without the tester doing anything. */
export type ReportContext = {
  route: string;
  routeParams: Record<string, unknown>;
  appVersion: string;
  buildNumber: string;
  gitSha: string | null;
  device: string;
  osVersion: string;
  screen: { width: number; height: number; scale: number };
  locale: string;
  network: { connected: boolean | null; type: string | null };
  auth: { signedIn: boolean; userId: string | null; onboarded: boolean | null };
  entitlement: { active: boolean | null; status: string | null };
  console: ConsoleEntry[];
  api: ApiEntry[];
  breadcrumbs: Breadcrumb[];
  /** The store slice relevant to the current screen, bounded and serialisable. */
  storeSlice: Record<string, unknown> | null;
  componentTag: string | null;
};

export type DebugReport = {
  id: string;
  createdAt: string;
  trigger: Trigger;
  /** Automatic captures land as drafts; the tester promotes them later. */
  draft: boolean;
  title: string;
  notes: string;
  severity: Severity;
  kind: Kind;
  area: string;
  resolution: Resolution;
  /** Relative filename of the screenshot inside the reports directory. */
  screenshot: string | null;
  synced: boolean;
  context: ReportContext;
};

/** What the tester fills in. Everything except the title is optional. */
export type ReportInput = {
  title: string;
  notes?: string;
  severity?: Severity;
  kind?: Kind;
  area?: string;
  componentTag?: string;
};
