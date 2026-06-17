// Units — the single source of truth for measurement display.
//
// RULE: values are ALWAYS stored canonical (SI/metric) in state and mock data —
// kg, cm, g, ml, kcal. Nothing else in the app does unit math. Screens convert
// only at the boundary: canonical → display on render, display → canonical on
// input commit. Never persist a displayed unit's number.
//
// Every function here is pure (no React, no store access) so it's trivially
// testable and reusable from any screen or the settings store.

// ---------------------------------------------------------------------------
// Dimensions + unit ids
// ---------------------------------------------------------------------------

export type WeightUnit = 'kg' | 'lb'; //        body weight
export type HeightUnit = 'cm' | 'ftin'; //      body height
export type MassUnit = 'g' | 'oz'; //           food mass / quantities
export type VolumeUnit = 'ml' | 'floz'; //      liquid volume
export type EnergyUnit = 'kcal' | 'kJ'; //      energy

export type UnitDimension = 'weight' | 'height' | 'mass' | 'volume' | 'energy';

export type UnitPreferences = {
  weight: WeightUnit;
  height: HeightUnit;
  mass: MassUnit;
  volume: VolumeUnit;
  energy: EnergyUnit;
};

// Metric/Imperial presets — the quick-toggle applies one of these wholesale.
export const METRIC_PREFERENCES: UnitPreferences = {
  weight: 'kg',
  height: 'cm',
  mass: 'g',
  volume: 'ml',
  energy: 'kcal',
};

export const IMPERIAL_PREFERENCES: UnitPreferences = {
  weight: 'lb',
  height: 'ftin',
  mass: 'oz',
  volume: 'floz',
  energy: 'kcal', // imperial countries still use kcal for food energy
};

export const DEFAULT_UNIT_PREFERENCES = METRIC_PREFERENCES;

/** True when every dimension matches the named system (for the quick-toggle). */
export function systemOf(prefs: UnitPreferences): 'metric' | 'imperial' | 'custom' {
  const eq = (a: UnitPreferences, b: UnitPreferences) =>
    a.weight === b.weight && a.height === b.height && a.mass === b.mass && a.volume === b.volume && a.energy === b.energy;
  if (eq(prefs, METRIC_PREFERENCES)) return 'metric';
  if (eq(prefs, IMPERIAL_PREFERENCES)) return 'imperial';
  return 'custom';
}

// ---------------------------------------------------------------------------
// Conversion factors (canonical → other)
// ---------------------------------------------------------------------------

const LB_PER_KG = 2.2046226218;
const IN_PER_CM = 1 / 2.54;
const OZ_PER_G = 1 / 28.349523125;
const FLOZ_PER_ML = 1 / 29.5735295625; // US fluid ounce
const KJ_PER_KCAL = 4.184;

// ---------------------------------------------------------------------------
// Number helpers
// ---------------------------------------------------------------------------

function group(value: number, fractionDigits = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

const round = (v: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
};

// ---------------------------------------------------------------------------
// Weight (canonical: kg)
// ---------------------------------------------------------------------------

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? round(kg * LB_PER_KG, 1) : round(kg, 1);
}
export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value / LB_PER_KG : value;
}
export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${group(kgToDisplay(kg, unit), kgToDisplay(kg, unit) % 1 ? 1 : 0)} ${unit}`;
}

// ---------------------------------------------------------------------------
// Height (canonical: cm). Imperial is ft + in (compound).
// ---------------------------------------------------------------------------

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalIn = cm * IN_PER_CM;
  let feet = Math.floor(totalIn / 12);
  let inches = Math.round(totalIn - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}
export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) / IN_PER_CM;
}
export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'ftin') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet} ft ${inches} in`;
  }
  return `${group(round(cm))} cm`;
}

// ---------------------------------------------------------------------------
// Food mass (canonical: g)
// ---------------------------------------------------------------------------

export function gToDisplay(g: number, unit: MassUnit): number {
  return unit === 'oz' ? round(g * OZ_PER_G, 1) : round(g);
}
export function displayToG(value: number, unit: MassUnit): number {
  return unit === 'oz' ? value / OZ_PER_G : value;
}
export function formatMass(g: number, unit: MassUnit): string {
  const v = gToDisplay(g, unit);
  return `${group(v, v % 1 ? 1 : 0)} ${unit}`;
}

// ---------------------------------------------------------------------------
// Volume (canonical: ml)
// ---------------------------------------------------------------------------

export function mlToDisplay(ml: number, unit: VolumeUnit): number {
  return unit === 'floz' ? round(ml * FLOZ_PER_ML, 1) : round(ml);
}
export function displayToMl(value: number, unit: VolumeUnit): number {
  return unit === 'floz' ? value / FLOZ_PER_ML : value;
}
export function formatVolume(ml: number, unit: VolumeUnit): string {
  const v = mlToDisplay(ml, unit);
  return `${group(v, v % 1 ? 1 : 0)} ${unit === 'floz' ? 'fl oz' : 'ml'}`;
}

// ---------------------------------------------------------------------------
// Energy (canonical: kcal)
// ---------------------------------------------------------------------------

export function kcalToDisplay(kcal: number, unit: EnergyUnit): number {
  return unit === 'kJ' ? round(kcal * KJ_PER_KCAL) : round(kcal);
}
export function displayToKcal(value: number, unit: EnergyUnit): number {
  return unit === 'kJ' ? value / KJ_PER_KCAL : value;
}
export function formatEnergy(kcal: number, unit: EnergyUnit): string {
  return `${group(kcalToDisplay(kcal, unit))} ${unit}`;
}

// ---------------------------------------------------------------------------
// Labels (for segmented controls / pickers)
// ---------------------------------------------------------------------------

export const UNIT_OPTIONS: Record<UnitDimension, { label: string; value: string }[]> = {
  weight: [
    { label: 'kg', value: 'kg' },
    { label: 'lb', value: 'lb' },
  ],
  height: [
    { label: 'cm', value: 'cm' },
    { label: 'ft / in', value: 'ftin' },
  ],
  mass: [
    { label: 'g', value: 'g' },
    { label: 'oz', value: 'oz' },
  ],
  volume: [
    { label: 'ml', value: 'ml' },
    { label: 'fl oz', value: 'floz' },
  ],
  energy: [
    { label: 'kcal', value: 'kcal' },
    { label: 'kJ', value: 'kJ' },
  ],
};

// ---------------------------------------------------------------------------
// Device-locale default (no native module — Hermes Intl only)
// ---------------------------------------------------------------------------

function deviceRegion(): string | undefined {
  try {
    const locale = Intl.NumberFormat().resolvedOptions().locale; // e.g. "en-US"
    return locale.split('-')[1]?.toUpperCase();
  } catch {
    return undefined;
  }
}

/** Imperial only for the three countries that actually use it; metric otherwise. */
export function deviceUnitPreferences(): UnitPreferences {
  const region = deviceRegion();
  const imperialRegions = ['US', 'LR', 'MM'];
  return region && imperialRegions.includes(region) ? IMPERIAL_PREFERENCES : METRIC_PREFERENCES;
}
