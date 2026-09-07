# UI pass report — the Claude Design file, applied

Date: 2026-09-08. Branch: `main` (committed, not left on a branch).
Scope: **style only** — colours, spacing, typography, shadows, radii, icons,
layout positioning, animation values and visual variants. No architecture, no
prop-interface changes, no navigation changes, no data-flow changes.

Source of truth: the Claude Design project `Lume App.dc.html` (shell +
`SummaryScreen` / `FoodScreen` / `GymScreen` / `ProfileScreen`), its bound design
system, `ios-frame.jsx` and `support.js`.

---

## 1. The finding that shaped the whole pass

**The design implies no token changes, and that was verified rather than assumed.**

The design system bound to the prototype is the bundle *this repo generated from
`src/lib/design/tokens.ts`* and pushed in the 2026-08-09 tokens-only sync. Its
`_ds_bundle.css` and our `.design-sync/tokens-pkg/tokens.css` share one SHA-256:

```
1fe452d98f92487ffc70517649f1a510a4aa546d4d798cc5a2ce4bf4067d21f6
```

Every colour, space, radius, shadow and duration the design uses already exists
here with the same value. **`src/lib/design/tokens.ts` was not modified.** The new
look is a change in *which* tokens a surface reaches for:

| Aspect | Before | After (design) |
|---|---|---|
| Page | `color.white` | `surface.backgroundAlt` |
| Card | `surface.card`, `radius.lg`, no shadow | `surface.cardElevated`, `radius.xl`, `shadow.sm` |
| Header | bordered `NavBar`, centred title | blurred floating strip; eyebrow + `title1` inside the scroll |
| Card header | bare `title3` | category-accent glyph + `bodyMedium` + scope + chevron |
| Segmented | black selected, white text | white selected + `shadow.sm` on a `light2` track |
| Progress track | `color.gray200` | `color.light2`, fill in the category accent |

Because no token key changed, `designTokensCssParity.test.ts` could not regress.

## 2. How "leave uncovered screens untouched" was honoured

`Screen`, `Card` and `SegmentedField` are each imported by screens the design does
**not** cover (`onboarding/measurements.tsx`, `gym/freeze.tsx`, `food/history.tsx`,
`gym/streak.tsx`, `dashboard/plan.tsx`). Changing a default would have restyled
those by side effect. Each therefore gained an **additive optional** prop whose
omitted value reproduces the previous rendering exactly, and only covered screens
opt in.

`SettingsList` is the one component restyled in place rather than behind a
variant: all six of its importers are covered screens.

---

## 3. Everything restyled

### Shared visual layer (commit `f1da32e`)
| File | Change |
|---|---|
| `display/Card.tsx` | `variant='elevated'` — `cardElevated` + `radius.xl` + `shadow.sm` |
| `navigation/Screen.tsx` | `variant='floating'` + `eyebrow` — grey page, no NavBar, blurred strip, floating glass back button, title inside the scroll |
| `navigation/FloatingHeader.tsx` | **new** — BlurView over the mask's solid part + an SVG tint fade; opaque under Reduce Transparency |
| `display/CardHeaderRow.tsx` | **new** — glyph + title + scope + chevron; the glyph is the only tinted element |
| `forms/SegmentedField.tsx` | `variant='inset'` — `light2` track, selected segment lifted in white + `shadow.sm` |

### Summary (commit `58a041a`)
| File | Change |
|---|---|
| `(tabs)/index.tsx` | Grey page + FloatingHeader, date eyebrow + "Summary" title + streak line, elevated cards with CardHeaderRow. The hardcoded greeting was dropped in favour of the design's title block |
| `energy.tsx` | Floating Screen ("Last 7 days"), elevated cards, bars on `light2` tracks, series recoloured to calories/blue |
| `dashboard/nutrition.tsx` | Floating Screen with the real device date as eyebrow, ChartCards recomposed as elevated cards, meals list in its own elevated card |

### Food (commit `1547431`)
| File | Change |
|---|---|
| `(tabs)/food.tsx` | Grey page + FloatingHeader, eyebrow + title, new elevated Calories card (logged energy + macro columns), meal rows as white `radius.xl` groups with hairlines, per-slot category dots |
| `food/add.tsx` | Chooser tiles: `surface.tile`, white 44pt disc with a per-method accent glyph |
| `food/quick-add.tsx`, `serving.tsx`, `barcode-confirm.tsx` | Inset segmented controls; `statLarge` energy readouts; macro tiles with category dots |
| `food/meals.tsx`, `new-recipe.tsx`, `[meal].tsx` | Floating Screen with eyebrows; elevated cards; hairline groups |
| `food/saved.tsx` | Rows on `surface.tile` with hairline separators; 28pt black add disc |
| `food/scan/*`, `FoodItemEditSheet`, `SavedMealsList`, `RecipesList` | Elevated cards; coloured left rails replaced by CardHeaderRow glyphs. **Confidence band, score and server factors untouched** |

### Gym (commit `555f3d1`)
| File | Change |
|---|---|
| `(tabs)/gym.tsx` | Grey page + FloatingHeader, date eyebrow + "Gym" title, streak strip card, design card order, nav buttons regrouped as a SettingsList |
| `domain/GymCalendar.tsx` | 7-column square-cell heatmap: streak-orange trained, `light3` freeze, `light2` missed, ring on today. Same props, same index-keyed model |
| `domain/ChartCard.tsx`, `GymSessionButton.tsx` | Elevated card + CardHeaderRow; logged pill on `surface.tile` with a positive dot |
| `gym/TodayCard.tsx`, `MuscleChart.tsx`, `GymPatternsCard.tsx` | Elevated cards with CardHeaderRow; muscle rows sorted by volume on `light2` tracks |
| `gym/session.tsx` | Floating Screen, elevated exercise cards, restyled checkboxes and set rows. **No logging or mutation code touched** (pinned by `gymOfflineSequence.test.ts`) |
| `gym/schedule.tsx`, `templates.tsx`, `new-template.tsx`, `exercise-progress.tsx` | Floating Screens; week and exercise rows collected into elevated hairline-separated cards |
| `gym/ExercisePicker`, `PlannedValuesForm`, `ParameterForm` | 34pt filter chips; inset segmented controls |

### Profile (commit `0165cd4`)
| File | Change |
|---|---|
| `display/SettingsList.tsx` | Restyled in place: `radius.xl` + `shadow.sm` group, 28pt icon chip, hairline separators inset past the chip, `light2`/`primary` Switch track. Props, a11y labels, large-text stacking and Switch semantics unchanged |
| `(tabs)/profile.tsx` | Grey page + FloatingHeader; the user's real name as eyebrow; elevated streak cards |
| `profile/settings.tsx` and the 10 other settings screens | All moved to floating Screen with their own eyebrows — one scaffold instead of twelve hand-rolled headers |
| `profile/scan-calibration.tsx` | Summary and accuracy merged into one elevated hero with a positive-tinted bar, plus three real stat tiles from `accuracy_summary` |
| `insights.tsx` | Floating Screen on both the consent-gate and loaded renders |
| `ai/*` cards | Elevated; orange/amber left borders removed (colour marks data, not surfaces); AI accent on the sparkle glyph only |

### Fixes found by running the app (commits `6983bc7`, `dc57e87`)
| Fix | Why it existed |
|---|---|
| `GymStatusCard`, `EnergyBalanceCard`, `PendingSyncBanner` elevated | All three sat outside every parallel owner's allow-list, so the Dashboard shipped three grey cards stranded among white ones. All are imported only by covered screens. `EnergyBalanceCard`'s burned series also moved from `accent.green` to `accent.blue` — burned energy is activity data, and green read as a success state |
| Floating title clears the floating back button | Every pushed settings screen drew its chevron across the large title and clipped the eyebrow ("ACCOUNT & APP" → "UNT & APP"). The scroll now clears the control's full height |

---

## 4. Token changes

**None.** See §1 — the design's values are already this repo's values. The only
token-name changes were moves off deprecated aliases onto their semantic twins
(`color.gray600` → `color.secondaryLabel`, `color.gray200` → `color.light2`),
which are identical values and therefore visually inert.

## 5. NEEDS ARCHITECTURE DECISION

Recorded in full in `DECISIONS.md`. Each is required for a faithful match and
each is a structural change a style pass may not make. **None were implemented.**

1. The floating glass tab bar, the 62pt `+` menu, and Profile leaving the tabs.
2. The four Summary detail views (we have two of the four routes).
3. A date switcher on Food — reads are today-only.
4. One unified food-detail sheet in place of four detail surfaces.
5. Two routes the design has and we do not: the Food month-calendar picker and
   the full-screen muscle-focus view.
6. Merging `(tabs)/profile.tsx` into `profile/settings.tsx`.
7. The 3D muscle body — needs three.js and per-mesh data.

Two smaller items surfaced during the pass and are worth a decision later: a
`tint` field on `SettingsRowProps` (the design tints each settings chip by
category), and exporting a `GlassIconButton` so a floating Screen can host a
circular action button instead of hand-rolling one.

## 6. Gaps

Full map in `UI_PASS_GAPS.md`. Summary:

- **23 screens the design does not cover were left completely untouched** — the
  entire onboarding flow (12), both legal screens, the entry gate, both layouts,
  `ai-query`, `dashboard/plan`, `food/history`, `gym/history`, `gym/streak`,
  `gym/freeze`.
- **13 elements the design shows were deliberately not built**, because no store
  or API produces them: steps and their series, the burn target, the weekly
  session target, per-session calories, the 3D body, form guides, template
  superset/tempo/RPE/notes, subscription price / payment method / usage bars /
  billing history, the scan-accuracy trend and corrections list, the Apple Health
  row, the weekly insight push toggle, saved-dish photography, the day switcher.
- Three screens inside covered areas were left untouched for cause:
  `food/custom-food.tsx` (text fields only — nothing the design changes), and the
  three camera routes `food/photo-capture|barcode-scan|label-scan.tsx` (the
  design's single scanner is a route merge, and the capture chrome guards
  consent-gated paths pinned by `phase14Regression.test.ts`).

## 7. Hard constraints — all held

- **No fabricated data.** Nothing rendered was invented. Where the design shows a
  datum with no source, the element was omitted rather than filled with a
  placeholder. The new Food calories card deliberately shows *logged* totals and
  says "kcal logged" — it has no goal, because that screen reads none. The
  dashboard's hardcoded greeting was removed.
- **Auth / RLS / entitlement gate** untouched — no screen's gating logic changed.
- **Confidence bands and the "Why?" panel** restyled only; `displayBand`, the
  score and the server factors are byte-identical.
- **Debug-capture gating** untouched.
- **Reduce Motion**: no new animation was added; a diff-wide check confirmed no
  ungated `withTiming` / `Animated` / `withRepeat` was introduced. No springs.
- **`productName.test.ts`** passes; a diff-wide grep confirms neither forbidden
  product name was introduced.
- A diff-wide grep also confirms **zero new hex literals and zero new `rgba()`**.
  The only raw numerics added are `letterSpacing: 1` and icon/skeleton pixel
  sizes, both long-standing repo conventions with no token scale behind them.

## 8. Test results

| | Suites | Tests | tsc | eslint |
|---|---|---|---|---|
| **Before** | 38 passed / 38 | 564 passed / 564 | 0 errors | 0 errors, 35 warnings |
| **After** | 38 passed / 38 | 564 passed / 564 | 0 errors | 0 errors, 35 warnings |

No test was deleted, weakened, or updated — no test needed updating, because the
repo has no snapshot tests and the two render tests assert behaviour and
accessibility labels rather than styling. The 35 eslint warnings are pre-existing
and unrelated. `npm run check:assets` passes (4 ok, 0 blockers); no image assets
were touched, only SF Symbols through the existing `Icon` primitive.

## 9. Verified on device vs. not

Verified by running the app on an iPhone 17 Pro simulator against Metro and
screenshotting: the Dashboard, Food, Gym and Profile tabs; Settings; Goals;
Subscription; and the Energy detail (which also confirmed the AI-consent gate
still fires). Screenshots were taken before and after for comparison.

### ⚠️ UNVERIFIABLE without a physical device

- **The Liquid Glass materials.** `expo-glass-effect` falls back to `BlurView` in
  the simulator, so the real iOS 26 glass on the back buttons and the FAB is
  unconfirmed.
- **`FloatingHeader`'s blur.** The strip renders, but simulator blur is not a
  faithful preview of on-device `backdrop-filter`-style compositing, and the CSS
  `mask-image` fade has no RN equivalent — the tint gradient approximates it.
- **Reduce Transparency and Reduce Motion paths.** The opaque-strip and
  no-animation branches were not exercised; they need the accessibility toggles.
- **Dynamic Type at accessibility sizes.** The large-text stacking in
  `SettingsList` and the food rows is unchanged code, but the new eyebrow + large
  title blocks were not checked at AX sizes.
- **Shadow rendering.** `shadow.sm` is deliberately near-invisible; whether the
  elevated cards read as lifted on a real display is a judgement call best made
  on hardware.
- **Haptics** on the restyled controls (unchanged code paths, but never firing in
  the simulator).

## 10. Commits

```
f1da32e  style(ui): the design file's surface language, as opt-in variants
58a041a  style(summary): the dashboard as a grey page of elevated cards
1547431  style(food): white meal groups on a grey page, one detail language
555f3d1  style(gym): streak strip, heatmap and session cards on the grey page
0165cd4  style(profile): the settings stack in one floating language
dc23b49  test(tokens): track the tokens.ts -> tokens.css parity guard
6983bc7  style(dashboard): the three cards the parallel pass could not reach
dc57e87  fix(ui): floating title must clear the floating back button
```
