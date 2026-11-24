// Shared cuisine option data for the cuisine picker (value + emoji). Labels
// come from onboarding.cuisine.options.<value> in the locale files.
import type { CuisineType } from '@/lib/types';

export type CuisineOption = { value: CuisineType; emoji: string };

export const CUISINE_OPTIONS: CuisineOption[] = [
  { value: 'south_asian', emoji: '🇮🇳' },
  { value: 'east_asian', emoji: '🥢' },
  { value: 'southeast_asian', emoji: '🍜' },
  { value: 'middle_eastern', emoji: '🥙' },
  { value: 'mediterranean', emoji: '🫒' },
  { value: 'western', emoji: '🍔' },
  { value: 'african', emoji: '🌍' },
  { value: 'latin_american', emoji: '🌮' },
];
