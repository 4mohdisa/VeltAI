// Shared cuisine option data — one source of truth for the cuisine picker
// (emoji + label) and the paywall's "personalised food database" line (label).
import type { CuisineType } from '@/lib/types';

export type CuisineOption = { value: CuisineType; emoji: string; label: string };

export const CUISINE_OPTIONS: CuisineOption[] = [
  { value: 'south_asian', emoji: '🇮🇳', label: 'South Asian' },
  { value: 'east_asian', emoji: '🥢', label: 'East Asian' },
  { value: 'southeast_asian', emoji: '🍜', label: 'Southeast Asian' },
  { value: 'middle_eastern', emoji: '🥙', label: 'Middle Eastern' },
  { value: 'mediterranean', emoji: '🫒', label: 'Mediterranean' },
  { value: 'western', emoji: '🍔', label: 'Western / Australian' },
  { value: 'african', emoji: '🌍', label: 'African' },
  { value: 'latin_american', emoji: '🌮', label: 'Latin American' },
];

export const CUISINE_LABEL: Record<CuisineType, string> = CUISINE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<CuisineType, string>,
);
