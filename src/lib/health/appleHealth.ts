// Apple Health (HealthKit) service layer.
//
// STATUS: the native module (`react-native-health`) is NOT installed and the
// HealthKit entitlement is still in compliance screening, so `isAvailable()` is
// false and every call returns its empty/false result. But ALL of the logic —
// permission flow, workout → exercise mapping, parameter mapping, and import
// dedupe by HealthKit UUID — is implemented and unit-tested behind an injectable
// native-module seam, so wiring the real module later is a one-line change
// (`__setNativeModule`). See DECISIONS.md.

// --- Native surface (what a real react-native-health adapter must provide) ----

export type NativeWorkout = {
  uuid: string;
  activityType: string; // HKWorkoutActivityType name, e.g. 'Running'
  start: string; //        ISO 8601
  end: string; //          ISO 8601
  totalEnergyBurnedKcal?: number;
  totalDistanceMeters?: number;
};

export type NativeHealthModule = {
  isAvailable(): boolean;
  requestPermissions(read: string[], write: string[]): Promise<boolean>;
  getActiveEnergy(start: Date, end: Date): Promise<number>;
  getWorkouts(start: Date, end: Date): Promise<NativeWorkout[]>;
  saveDietaryEnergy(date: Date, calories: number): Promise<void>;
};

// Set when the native module lands (or by tests). Null today → everything is a
// clean no-op.
let nativeModule: NativeHealthModule | null = null;

/** Wire the native HealthKit module (or a mock in tests). */
export function __setNativeModule(m: NativeHealthModule | null): void {
  nativeModule = m;
}

const READ_TYPES = ['ActiveEnergyBurned', 'Workout', 'DistanceWalkingRunning'];
const WRITE_TYPES = ['DietaryEnergyConsumed'];

// --- App-facing types ---------------------------------------------------------

/** A workout read from HealthKit, mapped onto a library exercise + parameters. */
export type HealthWorkout = {
  uuid: string;
  type: string; //          mapped library exercise name, e.g. 'Running'
  sessionType: 'cardio' | 'strength';
  start: string;
  end: string;
  durationMinutes: number;
  calories: number; //      active energy burned (kcal), 0 when unknown
  parameters: Record<string, number>; // mapped onto the Phase 12 parameter system
};

// --- Public API (guarded by isAvailable) --------------------------------------

/** True only when the native HealthKit module is present and available. */
export function isAvailable(): boolean {
  return nativeModule?.isAvailable() ?? false;
}

/** Ask for HealthKit read/write permission. Resolves false when unavailable. */
export async function requestPermissions(): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.requestPermissions(READ_TYPES, WRITE_TYPES);
}

/** Sum of active energy (kcal) burned in [start, end]. 0 when unavailable. */
export async function readActiveEnergy(start: Date, end: Date): Promise<number> {
  if (!nativeModule) return 0;
  return nativeModule.getActiveEnergy(start, end);
}

/** Workouts in [start, end], mapped to library exercises + parameters. Empty when unavailable. */
export async function readWorkouts(start: Date, end: Date): Promise<HealthWorkout[]> {
  if (!nativeModule) return [];
  const raw = await nativeModule.getWorkouts(start, end);
  return raw.map(mapWorkout);
}

/** Write a day's dietary energy (kcal) to HealthKit. Returns false when unavailable. */
export async function writeDietaryEnergy(date: Date, calories: number): Promise<boolean> {
  if (!nativeModule) return false;
  await nativeModule.saveDietaryEnergy(date, calories);
  return true;
}

// --- Mapping (pure, tested) ---------------------------------------------------

/** Map a HKWorkoutActivityType name to a library exercise name + session type. */
export function mapHealthKitType(activityType: string): { name: string; sessionType: 'cardio' | 'strength' } {
  switch (activityType) {
    case 'Running':
      return { name: 'Running', sessionType: 'cardio' };
    case 'Cycling':
      return { name: 'Cycling', sessionType: 'cardio' };
    case 'Swimming':
      return { name: 'Swimming', sessionType: 'cardio' };
    case 'Walking':
    case 'Hiking':
      return { name: 'Incline Walking', sessionType: 'cardio' };
    case 'Rowing':
      return { name: 'Rowing', sessionType: 'cardio' };
    case 'Elliptical':
      return { name: 'Elliptical Trainer', sessionType: 'cardio' };
    case 'StairClimbing':
      return { name: 'Stair Climber', sessionType: 'cardio' };
    case 'JumpRope':
      return { name: 'Jump Rope', sessionType: 'cardio' };
    case 'TraditionalStrengthTraining':
    case 'FunctionalStrengthTraining':
    case 'CrossTraining':
      return { name: activityType, sessionType: 'strength' };
    default:
      return { name: activityType, sessionType: 'cardio' };
  }
}

function durationMinutes(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Number.isFinite(ms) && ms > 0 ? Math.round(ms / 60000) : 0;
}

/** Map a native workout onto the app's HealthWorkout (incl. Phase 12 parameters). */
export function mapWorkout(w: NativeWorkout): HealthWorkout {
  const { name, sessionType } = mapHealthKitType(w.activityType);
  const dur = durationMinutes(w.start, w.end);
  const parameters: Record<string, number> = { duration_minutes: dur };
  // Distance + time → average speed (km/h), the treadmill/run formula input.
  if (w.totalDistanceMeters && w.totalDistanceMeters > 0 && dur > 0) {
    parameters.speed_kmh = Math.round((w.totalDistanceMeters / 1000 / (dur / 60)) * 10) / 10;
  }
  return {
    uuid: w.uuid,
    type: name,
    sessionType,
    start: w.start,
    end: w.end,
    durationMinutes: dur,
    calories: w.totalEnergyBurnedKcal ?? 0,
    parameters,
  };
}

// --- Sync service -------------------------------------------------------------

/** HealthSyncService: reads workouts and returns the ones not already imported
 *  (deduped by HealthKit UUID), ready to POST as gym sessions. */
export const healthSync = {
  /** New (not-yet-imported) workouts in [start, end]. Empty when unavailable. */
  async planImport(start: Date, end: Date, seenUuids: Set<string>): Promise<HealthWorkout[]> {
    const workouts = await readWorkouts(start, end);
    return dedupeWorkouts(workouts, seenUuids);
  },
};

/** Filter out workouts whose UUID has already been imported. */
export function dedupeWorkouts(workouts: HealthWorkout[], seenUuids: Set<string>): HealthWorkout[] {
  const out: HealthWorkout[] = [];
  const seenThisBatch = new Set<string>();
  for (const w of workouts) {
    if (!w.uuid || seenUuids.has(w.uuid) || seenThisBatch.has(w.uuid)) continue;
    seenThisBatch.add(w.uuid);
    out.push(w);
  }
  return out;
}
