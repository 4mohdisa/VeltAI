// Apple Health service layer — the native module is absent in this build, so the
// logic is proven against a mock module injected via __setNativeModule.
import {
  __setNativeModule,
  isAvailable,
  requestPermissions,
  readActiveEnergy,
  readWorkouts,
  writeDietaryEnergy,
  mapHealthKitType,
  mapWorkout,
  dedupeWorkouts,
  healthSync,
  type NativeHealthModule,
  type NativeWorkout,
  type HealthWorkout,
} from '@/lib/health/appleHealth';

function mockModule(workouts: NativeWorkout[] = []): NativeHealthModule {
  return {
    isAvailable: () => true,
    requestPermissions: async () => true,
    getActiveEnergy: async () => 420,
    getWorkouts: async () => workouts,
    saveDietaryEnergy: async () => undefined,
  };
}

afterEach(() => __setNativeModule(null));

describe('availability guard (no native module today)', () => {
  test('everything is a clean no-op without a module', async () => {
    expect(isAvailable()).toBe(false);
    expect(await requestPermissions()).toBe(false);
    expect(await readActiveEnergy(new Date(), new Date())).toBe(0);
    expect(await readWorkouts(new Date(), new Date())).toEqual([]);
    expect(await writeDietaryEnergy(new Date(), 500)).toBe(false);
  });

  test('activates when the native module is wired', async () => {
    __setNativeModule(mockModule());
    expect(isAvailable()).toBe(true);
    expect(await requestPermissions()).toBe(true);
    expect(await readActiveEnergy(new Date(), new Date())).toBe(420);
    expect(await writeDietaryEnergy(new Date(), 500)).toBe(true);
  });
});

describe('HealthKit type mapping', () => {
  test('maps known activity types to library exercises', () => {
    expect(mapHealthKitType('Running')).toEqual({ name: 'Running', sessionType: 'cardio' });
    expect(mapHealthKitType('Cycling')).toEqual({ name: 'Cycling', sessionType: 'cardio' });
    expect(mapHealthKitType('Walking')).toEqual({ name: 'Incline Walking', sessionType: 'cardio' });
    expect(mapHealthKitType('TraditionalStrengthTraining').sessionType).toBe('strength');
  });
  test('unknown types fall back to the raw label as cardio', () => {
    expect(mapHealthKitType('Pilates')).toEqual({ name: 'Pilates', sessionType: 'cardio' });
  });
});

describe('workout → parameters mapping', () => {
  const w: NativeWorkout = {
    uuid: 'abc',
    activityType: 'Running',
    start: '2026-07-18T08:00:00Z',
    end: '2026-07-18T08:30:00Z',
    totalEnergyBurnedKcal: 360,
    totalDistanceMeters: 5000, // 5 km in 30 min → 10 km/h
  };
  test('maps duration, calories, and average speed onto Phase 12 parameters', () => {
    const m = mapWorkout(w);
    expect(m.type).toBe('Running');
    expect(m.durationMinutes).toBe(30);
    expect(m.calories).toBe(360);
    expect(m.parameters.duration_minutes).toBe(30);
    expect(m.parameters.speed_kmh).toBe(10);
  });
  test('omits speed when distance is absent', () => {
    const m = mapWorkout({ ...w, totalDistanceMeters: undefined });
    expect(m.parameters.speed_kmh).toBeUndefined();
    expect(m.parameters.duration_minutes).toBe(30);
  });
  test('readWorkouts maps through the module', async () => {
    __setNativeModule(mockModule([w]));
    const out = await readWorkouts(new Date(), new Date());
    expect(out).toHaveLength(1);
    expect(out[0].parameters.speed_kmh).toBe(10);
  });
});

describe('import dedupe by HealthKit UUID', () => {
  const mk = (uuid: string): HealthWorkout => ({
    uuid,
    type: 'Running',
    sessionType: 'cardio',
    start: '2026-07-18T08:00:00Z',
    end: '2026-07-18T08:30:00Z',
    durationMinutes: 30,
    calories: 300,
    parameters: { duration_minutes: 30 },
  });

  test('drops already-imported and within-batch duplicate uuids', () => {
    const batch = [mk('a'), mk('b'), mk('a'), mk('c')];
    const fresh = dedupeWorkouts(batch, new Set(['b']));
    expect(fresh.map((w) => w.uuid)).toEqual(['a', 'c']);
  });

  test('planImport returns only new workouts', async () => {
    __setNativeModule(
      mockModule([
        { uuid: 'x', activityType: 'Running', start: '2026-07-18T08:00:00Z', end: '2026-07-18T08:20:00Z' },
        { uuid: 'y', activityType: 'Cycling', start: '2026-07-18T09:00:00Z', end: '2026-07-18T09:45:00Z' },
      ]),
    );
    const fresh = await healthSync.planImport(new Date(), new Date(), new Set(['x']));
    expect(fresh.map((w) => w.uuid)).toEqual(['y']);
    expect(fresh[0].type).toBe('Cycling');
  });
});
