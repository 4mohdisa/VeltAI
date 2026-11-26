// Row 11 · In memory Health provider: the only provider until the real HealthKit
// one lands. Like iOS, a kind is asked once and later requests keep the first
// answer, and the answer is never reported: a denied kind reads as null, the same
// as one never granted. Tests set the fixtures and the answers through __setMockHealth.
import type { HealthWorkout } from './appleHealth';
import type { BodyMassSample, HealthAuthorization, HealthKind, HealthProvider, HealthRange } from './types';

/** What the user picks on the sheet. Only the mock knows it; reads just see data or null. */
export type MockHealthAnswer = 'granted' | 'denied';

export type MockHealthState = {
  answers: Record<HealthKind, MockHealthAnswer>;
  steps: number | null;
  activeEnergy: number | null;
  bodyMass: BodyMassSample[];
  workouts: HealthWorkout[];
};

const defaults = (): MockHealthState => ({
  answers: { steps: 'granted', activeEnergy: 'granted', bodyMass: 'granted', workouts: 'granted' },
  steps: null,
  activeEnergy: null,
  bodyMass: [],
  workouts: [],
});

let state = defaults();
let asked = new Map<HealthKind, MockHealthAnswer>();

/** Resets the mock (every kind back to not_determined), then applies `next`. */
export function __setMockHealth(next: Partial<MockHealthState> = {}): void {
  state = { ...defaults(), ...next };
  asked = new Map();
}

const granted = (kind: HealthKind) => asked.get(kind) === 'granted';
const inRange = (iso: string, { start, end }: HealthRange) => {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
};
/** No samples in the range reads as null, like a kind that is not granted. */
const samplesIn = <T>(kind: HealthKind, all: T[], at: (s: T) => string, range: HealthRange): T[] | null => {
  const found = granted(kind) ? all.filter((s) => inRange(at(s), range)) : [];
  return found.length ? found : null;
};

export const mockHealthProvider: HealthProvider = {
  async getAuthorization(kind) {
    return asked.has(kind) ? 'requested' : 'not_determined';
  },
  async requestRead(kinds) {
    const result: Partial<Record<HealthKind, HealthAuthorization>> = {};
    for (const kind of kinds) {
      if (!asked.has(kind)) asked.set(kind, state.answers[kind]);
      result[kind] = 'requested';
    }
    return result;
  },
  async readSteps() {
    return granted('steps') ? state.steps : null;
  },
  async readActiveEnergy() {
    return granted('activeEnergy') ? state.activeEnergy : null;
  },
  async readBodyMass(range) {
    return samplesIn('bodyMass', state.bodyMass, (s) => s.at, range);
  },
  async readWorkouts(range) {
    return samplesIn('workouts', state.workouts, (w) => w.start, range);
  },
};
