// Row 11 · The mock Health provider honours the read only contract: nothing is
// read before a grant, a denial stays empty, and there is no way to write.
import { getHealthProvider } from './index';
import { __setMockHealth } from './mockProvider';
import { HEALTH_KINDS, type HealthProvider } from './types';
import type { HealthWorkout } from './appleHealth';

const DAY = new Date('2026-11-27T12:00:00Z');
const RANGE = { start: new Date('2026-11-20T00:00:00Z'), end: new Date('2026-11-27T23:59:59Z') };
const WEIGHT = { at: '2026-11-25T07:00:00Z', kg: 72.4 };
const OLD_WEIGHT = { at: '2026-10-01T07:00:00Z', kg: 74 };
const RUN: HealthWorkout = {
  uuid: 'w1',
  type: 'Running',
  sessionType: 'cardio',
  start: '2026-11-26T06:00:00Z',
  end: '2026-11-26T06:30:00Z',
  durationMinutes: 30,
  calories: 310,
  parameters: { distanceKm: 5 },
};

let health: HealthProvider;
const readAll = () =>
  Promise.all([health.readSteps(DAY), health.readActiveEnergy(DAY), health.readBodyMass(RANGE), health.readWorkouts(RANGE)]);

beforeEach(() => {
  __setMockHealth({ steps: 8421, activeEnergy: 512, bodyMass: [WEIGHT, OLD_WEIGHT], workouts: [RUN] });
  health = getHealthProvider();
});

test('every kind starts as not_determined', async () => {
  for (const kind of HEALTH_KINDS) expect(await health.getAuthorization(kind)).toBe('not_determined');
});

test('every read returns null before a grant', async () => {
  expect(await readAll()).toEqual([null, null, null, null]);
});

test('after a grant, reads return the fixture data, ranges filtered', async () => {
  await health.requestRead(HEALTH_KINDS);
  expect(await readAll()).toEqual([8421, 512, [WEIGHT], [RUN]]);
});

test('a denied kind reads as null, the same as not granted, even when asked again', async () => {
  const denyAll = { steps: 'denied', activeEnergy: 'denied', bodyMass: 'denied', workouts: 'denied' } as const;
  __setMockHealth({ steps: 8421, activeEnergy: 512, bodyMass: [WEIGHT], workouts: [RUN], answers: denyAll });
  const notGranted = await readAll();
  await health.requestRead(HEALTH_KINDS);
  await health.requestRead(HEALTH_KINDS);
  expect(await readAll()).toEqual(notGranted);
  expect(notGranted).toEqual([null, null, null, null]);
});

test('a granted kind with no data reads as null', async () => {
  __setMockHealth();
  await health.requestRead(HEALTH_KINDS);
  expect(await readAll()).toEqual([null, null, null, null]);
});

test('requestRead reports requested for each kind asked, whatever the answer, and only those', async () => {
  __setMockHealth({ answers: { steps: 'granted', activeEnergy: 'denied', bodyMass: 'granted', workouts: 'denied' } });
  expect(await health.requestRead(['steps', 'activeEnergy'])).toEqual({ steps: 'requested', activeEnergy: 'requested' });
  expect(await health.getAuthorization('activeEnergy')).toBe('requested');
  expect(await health.getAuthorization('bodyMass')).toBe('not_determined');
});

test('the provider has no write methods, only the six read only ones', () => {
  expect(Object.keys(health).sort()).toEqual(
    ['getAuthorization', 'readActiveEnergy', 'readBodyMass', 'readSteps', 'readWorkouts', 'requestRead'],
  );
});
