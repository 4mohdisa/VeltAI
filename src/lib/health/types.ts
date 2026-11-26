// Row 11 · The read only Health provider every screen goes through. iOS never
// tells an app that a read was denied, so reads have no denied state: a read
// returns null when its kind is not granted or has no data, and nothing is ever
// shown as read from Health when it was not. There are no write methods.
import type { HealthWorkout } from './appleHealth';

export type HealthKind = 'steps' | 'activeEnergy' | 'bodyMass' | 'workouts';

export const HEALTH_KINDS: readonly HealthKind[] = ['steps', 'activeEnergy', 'bodyMass', 'workouts'];

/** Whether the read sheet was shown for a kind. 'requested' says nothing about the answer. */
export type HealthAuthorization = 'requested' | 'not_determined';

export type HealthRange = { start: Date; end: Date };

export type BodyMassSample = { at: string; kg: number }; // at: ISO 8601

export interface HealthProvider {
  getAuthorization(kind: HealthKind): Promise<HealthAuthorization>;
  /** Asks to read the kinds (each is asked once) and returns each kind's status after asking. */
  requestRead(kinds: readonly HealthKind[]): Promise<Partial<Record<HealthKind, HealthAuthorization>>>;
  /** Step count for the local day that contains `day`. Null: not granted or no data. */
  readSteps(day: Date): Promise<number | null>;
  /** Active energy (kcal) for the local day that contains `day`. Null: not granted or no data. */
  readActiveEnergy(day: Date): Promise<number | null>;
  /** Weight samples in the range. Null: not granted or no data. */
  readBodyMass(range: HealthRange): Promise<BodyMassSample[] | null>;
  /** Workouts in the range. Null: not granted or no data. */
  readWorkouts(range: HealthRange): Promise<HealthWorkout[] | null>;
}
