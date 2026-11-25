// Dietary options, shared by the onboarding step and Profile > Preferences.
// Labels live in onboarding.dietary.options, keyed by these values.
import type { DietaryRequirement } from '@/lib/types';

export const DIETARY = [
  'halal',
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'none',
] as const satisfies readonly DietaryRequirement[];

/** "None" is mutually exclusive with the rest: picking it clears the others,
 *  picking anything else clears "None". */
export function nextDietary(prev: readonly string[], next: string[]): DietaryRequirement[] {
  const added = next.find((v) => !prev.includes(v));
  const result = added === 'none' ? ['none'] : added ? next.filter((v) => v !== 'none') : next;
  return result as DietaryRequirement[];
}
