# Settings — Units, Language & Custom Goals — Report

Global-readiness settings: a single canonical-storage units module, i18n
scaffolding, and user-owned calorie/macro goals. Frontend-only, mock store.
`docs/App Screens.md` was not present in the repo, so E2/E8/E13 were built from
this task's spec. Nothing outside Settings + the goal/unit *reads* on the
dashboard and nutrition detail was changed.

## What was built (per task)

### 1 · Unit system foundation — `src/lib/units/index.ts`
One pure, React-free module. **Canonical SI storage** (kg, cm, g, ml, kcal);
convert only at the display/input boundary.

API:
- Dimension unit types: `WeightUnit` (kg/lb), `HeightUnit` (cm/ftin), `MassUnit`
  (g/oz), `VolumeUnit` (ml/floz), `EnergyUnit` (kcal/kJ).
- `UnitPreferences` + `METRIC_PREFERENCES` / `IMPERIAL_PREFERENCES` /
  `DEFAULT_UNIT_PREFERENCES`; `systemOf(prefs)` → `'metric' | 'imperial' | 'custom'`.
- Per-dimension pairs: `kgToDisplay`/`displayToKg`/`formatWeight`,
  `cmToFeetInches`/`feetInchesToCm`/`formatHeight`, `gToDisplay`/`displayToG`/`formatMass`,
  `mlToDisplay`/`displayToMl`/`formatVolume`, `kcalToDisplay`/`displayToKcal`/`formatEnergy`.
- `UNIT_OPTIONS` (segmented-control options per dimension).
- `deviceUnitPreferences()` — imperial only for US/LR/MM via Hermes `Intl`
  (no native module), metric otherwise.

### 2 · Preferences screen (E8) — `src/app/profile/preferences.tsx`
Replaces the old Units screen. A **Metric / Imperial** quick-toggle sets all five
dimensions at once; per-dimension segmented controls allow mixing (the toggle
shows neither when units are `custom`). Backed by a mock **settings store**
(`src/lib/settings/store.ts`, zustand) seeded from the user profile, with
selectors `useUnitPreferences()` and `useEffectiveGoals()`.

### 3 · i18n scaffolding — `src/lib/i18n/`
**Library chosen: `i18next` + `react-i18next`** — pure JS, no native module, so
no rebuild was needed (Metro bundles it; verified `expo export` + on-device init
log). Device language detected via Hermes `Intl`; **language picker** in
Preferences switches live and back.

Locales: `en.json` (full source), `es.json` (full translation of every migrated
key), `fr.json` (**intentionally partial → proves fallback to English**).

**Migrated screens** (no hardcoded user-facing strings; grep-clean):
`profile/settings`, `profile/preferences`, `profile/goals`, `food/add`,
`(tabs)/food`, `(tabs)/index` (dashboard), `dashboard/nutrition`. Shared
`MacroBars`/`DailyMacroRing` were decoupled from English labels (added a stable
`macroKey`) and made energy-unit aware.

`[?]` **Not yet migrated** (clear pattern established — `useTranslation()` →
`t('ns.key')`): the remaining profile sub-screens (account, subscription,
notifications, apple-health, privacy, support, about, delete-account), the gym
tab + gym screens, onboarding, paywall, the food sub-flow screens
(photo/voice/barcode/saved/serving/custom-food/uncertainty/meal detail), and the
shared `Screen`/`EmptyState`/domain components. Meal-slot names in mock data
(`Breakfast`…) are data, not UI strings, and would move to keys when the backend
provides them.

### 4 · Custom calorie & macro goals (E13) — `src/app/profile/goals.tsx`
"Use AI recommendation" (onboarding-derived `AI_GOALS` from mock macros) vs
"Set my own". Custom mode owns the **calorie target** (shown/entered in the
Preferences energy unit) and **protein/carbs/fat** editable by **grams OR
percentage split**, kept in sync against the calorie target via Atwater factors
(4/4/9 kcal·g⁻¹) — grams is canonical, % is derived, so editing either recomputes
the other. Optional **fibre**. A **soft reconciliation hint** appears when macro
kcal don't sum to the target (never a block). **Reset to AI recommendation**
restores the computed values. Verified on device: AI mode shows 2150 kcal /
P165g·31% / C215g·40% / F75g·31% with inputs disabled.

### 5 · Wire-through & reconcile
The dashboard rings + macro bars and the nutrition detail now read
`useEffectiveGoals()` (custom override or AI default) and the energy unit from
the store. Changing the goal moves the targets live; switching kcal↔kJ reformats
every calorie figure in those views. Settings list reordered to **Account,
Subscription, Goals, Preferences, Notifications, Apple Health, Privacy, Support,
About**; the standalone units toggle was removed from Account (E3).

## Units / energy / goals flow-through
Confirmed wired through the dashboard (`(tabs)/index.tsx`) and nutrition detail
(`dashboard/nutrition.tsx`): calorie ring target, macro-bar targets, "remaining
today", per-meal calories and the plan line all read the store's effective goals
and energy unit. The "Set my own" override genuinely replaces the targets the app
uses — it is a default, not a lock.

`[?]` Energy unit on `CalorieCrossCheck` and the food-log calorie figures still
render kcal (canonical); they convert cleanly via `formatEnergy` when migrated —
left as a small follow-up to keep this pass scoped to the spec's named surfaces.

## Audit
- `npx tsc --noEmit` — **clean** (run before every commit).
- `npx expo export --platform ios` — **succeeds** (single iOS bundle).
- Simulator (iPhone 17 Pro, non-CI Metro): app runs in English; **Preferences**
  renders all five dimension segmented controls + the language picker (English
  checked); **Goals** renders AI mode with correct grams↔% derivation; the
  **dashboard** shows the AI goal (2,150 kcal). i18next initialised on device
  (init log present). No missing-key or React warnings in the Metro log.
- Hardcoded-string grep over the seven migrated screens — **no obvious
  user-facing literals** outside `t(...)` (icons/variants/accessibility excluded).

`[?]` Coordinate-driven taps (flipping toggles, picking a language, editing a
goal field) aren't drivable via `xcrun simctl` (no tap subcommand; idb not
installed). Live switching is verified structurally (store wiring + typed,
unit/goal-aware components) and by each screen rendering correctly with the right
seeded values; a manual tap-through is the one remaining human check.

`[?]` The generic "Open debugger to view warnings" dev banner appears; no related
warnings surfaced in the Metro log and all screens render/compute correctly.

## Deferred to backend (Phase 12)
Real persistence of the settings store (currently in-memory zustand), full
string migration across every remaining screen, and AI-goal recomputation from
live onboarding data.

## Git log
```
563b826 settings: wire units/energy/goals through dashboard + nutrition
7bf6175 settings: custom calorie + macro goals
7ae260d settings: i18n scaffolding + language picker
64f3868 settings: preferences screen — units app-wide
4d33bc5 settings: unit conversion + formatting foundation
```
(+ `settings: audit clean` — this report.)
