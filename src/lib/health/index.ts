// Row 11 · The one way the app reaches Health data.
import { mockHealthProvider } from './mockProvider';
import type { HealthProvider } from './types';

export type { BodyMassSample, HealthAuthorization, HealthKind, HealthProvider, HealthRange } from './types';

export function getHealthProvider(): HealthProvider {
  return mockHealthProvider;
}
