# UI pass — coverage gaps

Every screen under `src/app/` mapped against the Claude Design project
`Lume App.dc.html` (shell + `SummaryScreen` / `FoodScreen` / `GymScreen` /
`ProfileScreen`), 2026-09-08.

A screen the design covers was restyled to match. A screen it does not cover was
**left completely untouched** — no guessing, no extrapolating a style for it.
This file lists the second group, plus the parts of covered screens the design
shows but we cannot honestly build.

---

## 1. Screens the design does not cover — untouched

| Screen | What the design is missing to cover it |
|---|---|
| `src/app/onboarding/index.tsx` | No welcome/onboarding artboard at all. |
| `src/app/onboarding/goal.tsx` | No goal-picker view. |
| `src/app/onboarding/body-type.tsx` | No body-type view. |
| `src/app/onboarding/activity.tsx` | No activity-level view. |
| `src/app/onboarding/measurements.tsx` | No height/weight entry view. |
| `src/app/onboarding/cuisine.tsx` | No cuisine multi-select view. |
| `src/app/onboarding/dietary.tsx` | No dietary-requirements view. |
| `src/app/onboarding/targets.tsx` | No derived-targets review view. |
| `src/app/onboarding/preview.tsx` | No pre-signup preview view. |
| `src/app/onboarding/signup.tsx` | No sign-up / SSO view. |
| `src/app/onboarding/paywall.tsx` | No paywall artboard (the design defers to the RevenueCat paywall). |
| `src/app/onboarding/done.tsx` | No completion view. |
| `src/app/onboarding/_layout.tsx` | Structure only, no UI. |
| `src/app/legal/privacy.tsx` | The design links to a privacy policy but never renders one. |
| `src/app/legal/terms.tsx` | Same — a link target, never an artboard. |
| `src/app/index.tsx` | Entry gate; renders only a spinner while it decides. No design equivalent. |
| `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx` | Navigation structure, no visual surface of their own. |
| `src/app/ai-query.tsx` | No "Ask Lume" conversational view in the design. |
| `src/app/dashboard/plan.tsx` | No AI day-plan screen; the design dropped the plan card entirely. |
| `src/app/food/history.tsx` | No meal-history screen; the design browses days via a calendar picker it has and we do not. |
| `src/app/gym/history.tsx` | No session-history list; the design uses a month heatmap instead. |
| `src/app/gym/streak.tsx` | No dedicated streak screen; the design shows a streak strip inline on Gym. |
| `src/app/gym/freeze.tsx` | No streak-freeze sheet. The design marks freeze days on the heatmap but never shows how one is applied. |

## 2. Covered screens, with parts the design shows that were not built

These screens **were** restyled. The listed elements were deliberately left out
because no store or API produces them, and inventing them would breach the
standing no-fabricated-data rule.

| Screen | Element shown in the design, not built |
|---|---|
| `(tabs)/index.tsx` | Steps card and its 14-day series — the Apple Health seam is a deliberate no-op (`appleHealth.ts` exports a null module) and no backend column exists. |
| `(tabs)/index.tsx` | Daily burn target ("/ 2,400", "78% of target") — `goals` carries only `calorie_target`. |
| `(tabs)/index.tsx` | "of 5 sessions" weekly target — never asked in onboarding. |
| `(tabs)/gym.tsx` | Per-session calorie figures — `GymSession` JSON omits `calories_burned`. |
| `(tabs)/gym.tsx` | 3D muscle body with drag-to-spin — needs three.js (a new dependency) and per-mesh data we do not have. |
| `gym/exercise-progress.tsx` | Form-guide carousel and its numbered coaching steps — the library carries one `description` line. |
| `gym/new-template.tsx` | Superset / tempo / target-RPE / notes fields — absent from `TemplateExerciseInput`. |
| `profile/subscription.tsx` | Price, payment method, usage bars, billing history — not in the billing seam; Apple never exposes a payment method. |
| `profile/scan-calibration.tsx` | Accuracy trend sentence and the recent-corrections list — no time series and no read route for corrections. |
| `profile/integrations.tsx` | Apple Health connection row — the app cannot connect to it at all. |
| `profile/preferences.tsx` | Weekly insight push toggle — there is no notification system. |
| `(tabs)/food.tsx` | Day switcher and calendar dots — reads are today-only (see `DECISIONS.md`, NEEDS ARCHITECTURE DECISION 3). |
| `(tabs)/food.tsx` | Saved-dish photography — no image column on `saved_meals` / `recipes`. |

## 3. Structural work the design implies

Recorded in full under **NEEDS ARCHITECTURE DECISION** in `DECISIONS.md`: the
floating tab bar and Profile leaving the tabs, the four Summary detail views,
a date-aware food store, one unified food-detail sheet, the calendar and
muscle-focus routes, the Profile-root merge, and the 3D body. None were
implemented; each needs a call that is outside a style pass.
