// Row 11 · The read only Health provider every screen goes through. A read
// returns null when its kind is not granted, so nothing is ever shown as read
// from Health when it was not. There are no write methods.
import type { HealthWorkout } from './appleHealth';

export type HealthKind = 'steps' | 'activeEnergy' | 'bodyMass' | 'workouts';

export const HEALTH_KINDS: readonly HealthKind[] = ['steps', 'activeEnergy', 'bodyMass', 'workouts'];

export type HealthAuthorization = 'granted' | 'denied' | 'not_determined';

export type HealthRange = { start: Date; end: Date };

export type BodyMassSample = { at: string; kg: number }; // at: ISO 8601

export interface HealthProvider {
  getAuthorization(kind: HealthKind): Promise<HealthAuthorization>;
  /** Asks to read the kinds and returns the authorization each one ends with. */
  requestRead(kinds: readonly HealthKind[]): Promise<Partial<Record<HealthKind, HealthAuthorization>>>;
  /** Step count for the local day that contains `day`. */
  readSteps(day: Date): Promise<number | null>;
  /** Active energy (kcal) for the local day that contains `day`. */
  readActiveEnergy(day: Date): Promise<number | null>;
  readBodyMass(range: HealthRange): Promise<BodyMassSample[] | null>;
  readWorkouts(range: HealthRange): Promise<HealthWorkout[] | null>;
}
