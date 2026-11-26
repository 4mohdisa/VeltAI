// Row 11 · In memory Health provider: the only provider until the real HealthKit
// one lands. Like iOS, a kind is asked once; later requests keep the first answer.
// Tests set the fixtures and the answers through __setMockHealth.
import type { HealthWorkout } from './appleHealth';
import type { BodyMassSample, HealthAuthorization, HealthKind, HealthProvider, HealthRange } from './types';

type Answer = Exclude<HealthAuthorization, 'not_determined'>;

export type MockHealthState = {
  answers: Record<HealthKind, Answer>;
  steps: number;
  activeEnergy: number;
  bodyMass: BodyMassSample[];
  workouts: HealthWorkout[];
};

const defaults = (): MockHealthState => ({
  answers: { steps: 'granted', activeEnergy: 'granted', bodyMass: 'granted', workouts: 'granted' },
  steps: 0,
  activeEnergy: 0,
  bodyMass: [],
  workouts: [],
});

let state = defaults();
let authorization = new Map<HealthKind, Answer>();

/** Resets the mock (every kind back to not_determined), then applies `next`. */
export function __setMockHealth(next: Partial<MockHealthState> = {}): void {
  state = { ...defaults(), ...next };
  authorization = new Map();
}

const granted = (kind: HealthKind) => authorization.get(kind) === 'granted';
const inRange = (iso: string, { start, end }: HealthRange) => {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
};

export const mockHealthProvider: HealthProvider = {
  async getAuthorization(kind) {
    return authorization.get(kind) ?? 'not_determined';
  },
  async requestRead(kinds) {
    const result: Partial<Record<HealthKind, HealthAuthorization>> = {};
    for (const kind of kinds) {
      if (!authorization.has(kind)) authorization.set(kind, state.answers[kind]);
      result[kind] = authorization.get(kind);
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
    return granted('bodyMass') ? state.bodyMass.filter((s) => inRange(s.at, range)) : null;
  },
  async readWorkouts(range) {
    return granted('workouts') ? state.workouts.filter((w) => inRange(w.start, range)) : null;
  },
};
