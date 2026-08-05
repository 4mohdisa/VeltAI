// Assembling a report: screenshot + everything knowable about the moment.
//
// Every field here is captured without the tester doing anything, because the
// whole value of the system is that filing a report costs two taps. Anything
// that needs a decision goes in the sheet, not here.
import { Dimensions, NativeModules, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { captureScreen } from 'react-native-view-shot';

import { readApi, readBreadcrumbs, readConsole } from '../buffers';
import type { DebugReport, ReportContext, ReportInput, Trigger } from '../types';
import { AREAS } from '../types';
import { APP_VERSION, BUILD_NUMBER, GIT_SHA } from '@/lib/appVersion';
import { addReport, saveScreenshot, syncReport } from './store';

// The tag set by the nearest <DebugTag> currently on screen, if any.
let activeTag: string | null = null;
export const setActiveTag = (name: string | null): void => {
  activeTag = name;
};
export const getActiveTag = (): string | null => activeTag;

// The current route, pushed in by the debug root so capture never has to reach
// into a router hook from outside React.
let currentRoute = { path: 'unknown', params: {} as Record<string, unknown> };
export const setCurrentRoute = (path: string, params: Record<string, unknown>): void => {
  currentRoute = { path, params };
};

/** Map a route path onto one of the real feature areas. */
export function areaForRoute(path: string): string {
  const p = path.toLowerCase();
  if (p.includes('scan') || p.includes('photo-capture') || p.includes('barcode') || p.includes('label')) return 'scan';
  if (p.includes('onboarding')) return p.includes('paywall') ? 'paywall' : 'onboarding';
  if (p.includes('paywall') || p.includes('subscription')) return 'paywall';
  if (p.includes('food') || p.includes('meal') || p.includes('recipe')) return 'food log';
  if (p.includes('gym') || p.includes('workout') || p.includes('exercise')) return 'gym';
  if (p.includes('insight') || p.includes('ai-query')) return 'insights';
  if (p.includes('energy')) return 'energy';
  if (p.includes('profile') || p.includes('settings') || p.includes('legal')) return 'settings';
  if (p.includes('sign') || p.includes('auth')) return 'auth';
  if (p === '/' || p.includes('index') || p.includes('dashboard')) return 'dashboard';
  return 'other';
}

// Bound whatever a store hands over: reports are pasted into a chat window, and
// a whole day of food logs would drown the actual evidence.
function boundSlice(v: unknown, maxChars = 4000): Record<string, unknown> | null {
  try {
    const s = JSON.stringify(v);
    if (!s) return null;
    if (s.length <= maxChars) return JSON.parse(s) as Record<string, unknown>;
    return { truncated: true, bytes: s.length, preview: s.slice(0, maxChars) };
  } catch {
    return null;
  }
}

/** The store slice worth having for the screen the tester is on. Imported
 *  lazily so a screen the report is not about costs nothing. */
async function storeSliceFor(area: string): Promise<Record<string, unknown> | null> {
  try {
    if (area === 'food log' || area === 'scan') {
      const { useFoodStore } = await import('@/lib/data/foodStore');
      const s = useFoodStore.getState();
      return boundSlice({ meals: s.meals, savedFoodCount: s.savedFoods.length });
    }
    if (area === 'gym') {
      const { useGymStore } = await import('@/lib/data/gymStore');
      const s = useGymStore.getState();
      return boundSlice({ streak: s.streak, sessionCount: s.sessions.length, sessions: s.sessions.slice(0, 5) });
    }
    if (area === 'onboarding' || area === 'paywall') {
      const { useOnboardingStore } = await import('@/lib/stores/onboarding');
      return boundSlice(useOnboardingStore.getState());
    }
    if (area === 'dashboard' || area === 'settings' || area === 'energy') {
      const { useUserStore } = await import('@/lib/data/userStore');
      const p = useUserStore.getState().profile;
      // Identity is deliberately omitted — a report is not the place for it.
      return boundSlice({
        hasName: p.name.length > 0,
        weightKg: p.weightKg,
        heightCm: p.heightCm,
        age: p.age,
        goal: p.goal,
        activityLevel: p.activityLevel,
      });
    }
  } catch {
    // A store that will not load is not a reason to lose the report.
  }
  return null;
}

async function networkState(): Promise<ReportContext['network']> {
  try {
    const s = await Network.getNetworkStateAsync();
    return { connected: s.isConnected ?? null, type: s.type ?? null };
  } catch {
    return { connected: null, type: null };
  }
}

async function authState(): Promise<ReportContext['auth']> {
  try {
    const { getHasCompletedOnboarding } = await import('@/lib/storage/secureStore');
    const onboarded = await getHasCompletedOnboarding().catch(() => null);
    const { getDebugAuthSnapshot } = await import('./runtime');
    const snap = getDebugAuthSnapshot();
    return { signedIn: snap.signedIn, userId: snap.userId, onboarded };
  } catch {
    return { signedIn: false, userId: null, onboarded: null };
  }
}

async function entitlementState(): Promise<ReportContext['entitlement']> {
  try {
    const { getDebugEntitlementSnapshot } = await import('./runtime');
    return getDebugEntitlementSnapshot();
  } catch {
    return { active: null, status: null };
  }
}

let seq = 0;
const newId = (): string => `r_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/** Take the screenshot. Bounded quality/size — these accumulate for weeks. */
async function screenshot(): Promise<string | null> {
  try {
    return await captureScreen({ format: 'jpg', quality: 0.6, result: 'tmpfile' });
    // ponytail: whole-screen capture. A per-view ref would be sharper scoped,
    // but the tester wants "what I was looking at", which is the screen.
  } catch {
    return null;
  }
}

export async function buildContext(): Promise<ReportContext> {
  const win = Dimensions.get('window');
  const area = areaForRoute(currentRoute.path);
  const [network, auth, entitlement, storeSlice] = await Promise.all([
    networkState(),
    authState(),
    entitlementState(),
    storeSliceFor(area),
  ]);
  return {
    route: currentRoute.path,
    routeParams: currentRoute.params,
    appVersion: APP_VERSION,
    buildNumber: BUILD_NUMBER,
    gitSha: GIT_SHA,
    device: Device.modelName ?? 'unknown',
    osVersion: `${Platform.OS} ${Device.osVersion ?? String(Platform.Version)}`,
    screen: { width: win.width, height: win.height, scale: win.scale },
    locale:
      (NativeModules.SettingsManager?.settings?.AppleLocale as string | undefined) ??
      (NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] as string | undefined) ??
      'unknown',
    network,
    auth,
    entitlement,
    console: readConsole(),
    api: readApi(),
    breadcrumbs: readBreadcrumbs(),
    storeSlice,
    componentTag: activeTag,
  };
}

/**
 * Capture and persist a report. Writes to disk BEFORE attempting sync, so a
 * crash or a dead network cannot lose it.
 *
 * `draft` marks automatic captures: they are filed silently and never modal
 * over what the tester is doing.
 */
export async function capture(
  trigger: Trigger,
  input: ReportInput,
  opts: { draft?: boolean } = {},
): Promise<DebugReport> {
  const id = newId();
  const [shot, context] = await Promise.all([screenshot(), buildContext()]);
  const stored = shot ? await saveScreenshot(shot, id) : null;

  const area = input.area ?? areaForRoute(context.route);
  const report: DebugReport = {
    id,
    createdAt: new Date().toISOString(),
    trigger,
    draft: opts.draft ?? false,
    title: input.title,
    notes: input.notes ?? '',
    severity: input.severity ?? (opts.draft ? 'major' : 'minor'),
    kind: input.kind ?? 'bug',
    area: (AREAS as readonly string[]).includes(area) ? area : 'other',
    resolution: 'open',
    screenshot: stored,
    synced: false,
    context: { ...context, componentTag: input.componentTag ?? context.componentTag },
  };

  await addReport(report); // on disk from here on
  void syncReport(report); // secondary copy, never awaited by the UI
  return report;
}
