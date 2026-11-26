# Design intent audit (Row 14b, step 1)

27 Nov 2026, branch loop/phase4. Documentation only: no code was changed. Every finding below was read from the code (file:line); nothing was checked on a device. References from Mobbin are in DESIGN_REFERENCES.md under "Row 14b".

## How the screens connect

- Root gate `src/app/index.tsx` sends a user to onboarding, the paywall or `/(tabs)`.
- `src/app/(tabs)/_layout.tsx` has three tabs: Summary (`index`), Food and Gym. The floating bar's black "+" opens Log food (`/food/add`) and Log gym (`/gym/log-session`).
- Profile is not a tab. The avatar on each tab opens `/profile`.
- Summary is the hub. Its cards open `/energy`, `/dashboard/week`, `/dashboard/training` and `/dashboard/nutrition`, plus `/dashboard/plan` (dev builds only). Its streak opens `/gym/streak`.
- Food and Gym push into their own `/food/*` and `/gym/*` stacks.
- `/insights` opens only from the Food anomaly banner and Profile.
- Every dashboard detail screen is read only and ends at Back.

## Screens

Columns: **Why open** (the job), **In context** (how it is used), **Next** (what the user needs to know next), **Leave out** (what does not earn its place).

### Tabs and dashboards

| Screen | Why open | In context | Next | Leave out |
|---|---|---|---|---|
| `index.tsx` (gate) | Never on purpose | A spinner at launch | Where they land | Nothing visible |
| `(tabs)/index.tsx` Summary | "Am I on track today?" | A glance, often in the morning or after a meal | What to eat or train next | The Plan card in release (it is mock data; `hooks.ts:582`) |
| `(tabs)/food.tsx` Food | Log or check a meal | One hand, at the table, often for a past meal | What is left for the day | Nothing; it is the core screen |
| `(tabs)/gym.tsx` Gym | Start or log today's session | At the gym, between sets | Today's workout and the streak | The "N sessions" label, which shows the all-time total under a month calendar (`gym.tsx:166`) |
| `dashboard/nutrition.tsx` | Macro detail | After the Summary macros card | Which macro is short | Its 7-day chart titled "Today against targets" (`nutrition.tsx:144`) |
| `dashboard/week.tsx` | Week energy trend | Weekly review | Which day went over | The Net toggle, which changes only the stat line (`week.tsx:149-167`) |
| `dashboard/training.tsx` | Training volume this week | Weekly review | Whether to train today | None |
| `dashboard/plan.tsx` | Day timeline | Dev builds only | Next meal or session | The whole screen in release (unreachable, mock data) |
| `energy.tsx` | Eaten vs burned | After the Summary energy card | Whether the balance is real (burn needs body stats) | None |
| `insights.tsx` | AI findings | Occasionally, from the anomaly banner | What to change | None |
| `ai-query.tsx` | Ask a question | Ad hoc | The answer | None |
| `ai-consent.tsx` | Grant AI consent | Once, before the first AI use | That they return to what they asked for | None |

### Food

| Screen | Why open | In context | Next | Leave out |
|---|---|---|---|---|
| `food/add.tsx` | Choose how to log | From a meal's "+" or the bar "+" | That the item lands in the meal they chose | None |
| `food/detail.tsx` | Set the portion and meal | After a search hit, barcode or logged row | Calories for the portion | None |
| `food/quick-add.tsx` | Log calories only | In a hurry, eating out | That it went into the right meal | None (250 kcal start is the design's figure, `quick-add.tsx:44`) |
| `food/barcode-scan.tsx` | Scan packaged food | Holding the pack | The product, or a way out if not found | None |
| `food/label-scan.tsx` | Read a nutrition label | When the barcode is unknown | The per-serving values to confirm | None |
| `food/photo-capture.tsx` | Estimate a plate | Before eating | That the review card on Food holds the result | None |
| `food/saved.tsx` | Re-log a usual dish | Repeat meals | That it was logged, and its portion | None |
| `food/custom-food.tsx` | Add a food search lacks | After "no matches" | That it can now be logged | None |
| `food/calendar.tsx` | Jump to a day | Back-filling a missed day | Which days have logs | None |
| `food/history.tsx` | Last 7 days at a glance | Weekly check | That a day can be opened | None |
| `food/meals.tsx`, `food/new-recipe.tsx` | Recipes | Nothing opens them (`new-recipe.tsx:121` is the only link) | n/a | The pair, until an entry point exists |

### Gym

| Screen | Why open | In context | Next | Leave out |
|---|---|---|---|---|
| `gym/log-session.tsx` | Log today in one step | After training | That the streak moved | None |
| `gym/session.tsx` | Log sets as they happen | Between sets, sweaty hands | Last time's numbers for this exercise | None |
| `gym/exercise-progress.tsx` | Am I getting stronger? | Mid-session or reviewing | Best set and trend | None |
| `gym/muscles.tsx` | Which muscles got work | Weekly review | What to train next | None |
| `gym/streak.tsx` | Streak detail | After the streak strip | How to protect it (freeze) | None |
| `gym/freeze.tsx` | Save a streak on a missed day | Rest or sick day | Why it is disabled with 0 freezes | None |
| `gym/history.tsx` | Past sessions | Review | What was done in one session | None |
| `gym/templates.tsx`, `gym/new-template.tsx` | Build a workout | Planning, at home | Planned sets, reps and weight | None |
| `gym/schedule.tsx` | Assign workouts to days | Weekly planning | That a workout must exist first | None |

### Onboarding, profile and legal

| Screen | Why open | In context | Next | Leave out |
|---|---|---|---|---|
| Welcome (`onboarding/index.tsx`) | Start or sign in | First launch | That questions build their plan | None |
| goal, activity, cuisine, dietary, body-type | Answer one question | First run, quick taps | Progress through the flow | `training-days.tsx`: stored but not sent (`stores/onboarding.ts`, payload at 160-185; screen comment at :2) |
| preview | See what the plan will do | Before the account ask | That an account comes next | None |
| signup | Create or enter an account | Mid-flow or returning | That their answers are kept | None |
| measurements | Body stats for targets | After the account | Why each value is asked | None |
| targets | See the daily numbers | Before paying | How they were worked out | None |
| paywall | Start the trial | Before the app opens | Price, renewal, cancel | None |
| done | Hand-off | 750 ms, automatic | n/a | None |
| `profile/index.tsx` | Settings hub | Rarely | Where each setting lives | Rows repeated elsewhere: Terms, Privacy policy and Export (also in `profile/privacy.tsx:85-86,127`), Restore (also in `subscription.tsx:139`) |
| account, goals, preferences, integrations, privacy | Change one setting | Rarely | That it saved | None |
| `profile/feedback.tsx`, `profile/support.tsx` | Contact the team | Rarely | That it was sent | One of the two paths: both take a message |
| scan-calibration | How accurate scans are | Curiosity | How to improve it | None |
| subscription, winback, leaving | Manage or keep the plan | Before cancelling | How to cancel or stay | The survey on `leaving.tsx`, which is never sent (no submit, `leaving.tsx:70`) |
| delete-account | Delete the account | Once | What gets deleted | None |
| `legal/privacy.tsx`, `legal/terms.tsx` | Read the policies | Before sign-up or paying | n/a | None |

## Key numbers

| Item (screen) | Data behind it | Tap today | Tap should lead to |
|---|---|---|---|
| Calorie ring and total (Food) | Sum of `useFoodLog` rows for the selected day, against `useGoals` | Nothing (`food.tsx:709-752`) | `/dashboard/nutrition` |
| Macros card "Today" (Summary) | `useDailyMacros`, which reads the Food tab's selected day (`hooks.ts:320-321`, `foodStore.ts:180`) | `/dashboard/nutrition` | Same, but showing today |
| Macro bars (Nutrition) | `useDailyMacros`, `useFibreConsumed` | Nothing | Food tab on that day |
| Weekly bars (Summary This week) | GET /api/energy-balance/week | Card: `/dashboard/week`; bar: picks the day | Week detail with that day's values shown |
| Energy balance (Summary) | `useEnergyWeek`, `todayRow` | `/energy` | Same |
| Workouts count (Summary) | `useGymRange(7)` counted Monday to Sunday (`summaryCards.ts:58`) | `/dashboard/training` | Same, using the same week rule (training uses the last 7 days, `training.tsx:114-117`) |
| Streak (Summary, Gym) | GET /api/gym/streak | `/gym/streak` | Same |
| Freezes (Streak) | `streak.freezesAvailable` | Nothing | `/gym/freeze` |
| Month sessions label (Gym) | `streak.totalGymDays` (all time) | Nothing | The month's session count, not tappable |
| Gym month calendar days | `useGymMonth` | Nothing | That day's session (post launch, no detail screen yet) |
| Muscle cards (Gym, Muscles) | GET /api/gym/patterns | Header: `/gym/muscles`; rows: nothing | Rows stay static until per-muscle data exists |
| Today's workout (Gym) | GET /api/gym/today | Start: `/gym/session` | Same |
| Sets, reps, kg (Session) | Prefilled from the plan (`session.tsx:100-105`) | Number pad | Prefill from the last session for that exercise |
| Volume bars, best set (Exercise progress) | GET /api/gym/progress/:name | Nothing | Static |
| Day rows (Food history) | GET /api/food/summary | Nothing (`history.tsx:150`) | Food tab on that day |
| Targets kcal and macros (Onboarding) | `deriveTargets` | Adjust edits kcal only | Adjust recalculates macros too (`targets.tsx:85`) |

## Fix list

### SMALL (flow or default change, no visual change), ranked by user benefit

1. **Keep the chosen meal through Add.** The meal from "Add to dinner" is dropped on Search, Barcode, Scan and label scan (`add.tsx` forwards `slot`; `food.tsx:208` reads only `focus`; `food.tsx:388` and `detail.tsx:178,247` use `slotForNow()`). Every per-meal log can land in the wrong meal.
   - Search: done. The Food tab reads `?slot` through `slotFromParam` (`src/lib/data/scan.ts`) for the one-tap "+" and passes it to the search detail sheet; clearing the search drops it. Test: `src/__tests__/render/foodSearchSlot.render.test.tsx`.
   - Barcode scanner: done. `barcode-scan.tsx` reads `?slot` through `slotFromParam` and puts it in the barcode detail subject (`slot`), never in the route. Test: `src/__tests__/render/barcodeScanSlot.render.test.tsx`.
   - Barcode detail sheet: done. Barcode mode uses `subject.slot ?? slotForNow()` (`detail.tsx:247`). Test: `src/__tests__/render/barcodeDetailSlot.render.test.tsx`.
   - Done (Round 92): "Scan again" on the not-found sheet keeps the meal; it reopens the scanner with `?slot` set from the subject's slot.
   - Done (Round 94): label scan reads `?slot` through `slotFromParam`, falling back to the meal for the time of day. Test: `src/__tests__/render/labelScanSlot.render.test.tsx`.
   - Done (Round 97): a log from the detail sheet drops the Food tab's `?slot` (the subject store counts logs; the tab's search-clear `dropSlot` runs on each). Test: `src/__tests__/render/foodSearchSlot.render.test.tsx`.
   - Done (Round 96): the scanner's "Photograph label" button passes the meal to label scan as `?slot`. Test: `src/__tests__/render/barcodeScanSlot.render.test.tsx`.
   - Done (Round 99): the meal photo scan reads `?slot` through `slotFromParam` and passes it to `startMultiPhotoScan` and `startPhotoScan`, which default to `slotForNow()` for other callers. Test: `src/__tests__/photoCaptureSlot.render.test.tsx`.
   - Done (Round 100): quick-add uses slotFromParam in place of its inline slot check. Test: `src/__tests__/render/quickAdd.render.test.tsx`.
2. **Summary "Today" shows today.** The Summary macros card and Nutrition read the Food tab's selected day (`hooks.ts:320-321`). After the user looks at yesterday, Summary is wrong.
   - Done (Round 105): Summary and Nutrition "Today" always read today's rows (`byDate[todayISO()]` in `useDailyMacros` and `useFibreConsumed`), whatever day the Food tab shows. Test: `src/__tests__/render/summaryToday.render.test.tsx`.
3. **Remove a set in a session.** "Log" prefills the planned sets (3 if none) and only "Add set" exists (`session.tsx:101,256,534-538`). Logging 1 of 3 sets is impossible.
   - Done (Round 106): each set row in a session has a "Remove set" button (44 pt target), so 1 of 3 planned sets can be logged; Finish saves only the sets left, and removing every set unticks the exercise so nothing is saved for it. Test: `src/__tests__/render/sessionRemoveSet.render.test.tsx`.
4. **Prefill session sets from the last session**, not the plan (`session.tsx:100-105`). This is the most useful default at the gym.
   - Done (Round 107): a session's sets prefill from the newest earlier session with that exercise (set count, reps, weight via `lastSetsFor` in `src/lib/data/gymRange.ts`, over the last 90 days read by `useGymRange`), and from the plan when there is none. Tests: `src/__tests__/lastSets.test.ts`, `src/__tests__/render/sessionLastSets.render.test.tsx`.
5. **Resubscribe from Profile works after sign-out.** Winback opens the onboarding paywall, whose purchase runs `completeOnboarding` against a store that sign-out resets (`paywall.tsx:157-160`, `resetRegistry.ts:52`). Inferred from code: test this first.
   - Done (Round 108): reproduced first: after sign-out the onboarding store is empty, so a purchase or restore from the win back paywall failed the answer check ("Add your age before finishing setup.") and the user never entered the app. When the local answers fail the check, the paywall now asks the server, and on a completed record it marks onboarding complete and replaces to `/(tabs)` without posting. Test: `src/__tests__/resubscribeAfterSignOut.render.test.tsx`.
   - Done (Round 111): a signed-in user whose device already finished onboarding also enters the app on the server record when resubscribing, with no second post and no `/onboarding/done`; a 401 on that record check ends the session with the expired-session message instead of a missing-answer message. Tests: `src/__tests__/render/paywallOnboardingPost.render.test.tsx`, `src/__tests__/render/paywallSessionExpired.render.test.tsx`.
6. **Sign in with no server record goes to goal, not measurements.** Today steps 1 to 4 are skipped, the paywall then fails with goal or activity missing, and Back goes to a preview that is not in the stack (`postAuth.ts:30,36`, `measurements.tsx:280`).
   - Done (Round 110): after sign-in with no server record, `resolvePostAuth` sends a user with no goal or activity on the device to `/onboarding/goal`; a user who reached signup through steps 1 to 6 still goes to measurements. The launch gate (`index.tsx`) was unchanged: with no saved step it already opens Welcome, never measurements. Test: `src/__tests__/onboardingPostAuth.test.ts`.
7. **A log entry on every Gym day.** The Gym tab's log button shows only when today has a scheduled workout (`gym.tsx:189`).
   - Done (Round 112): the Gym tab shows "Log this session" whenever today has no session, rest days and plans with no exercises included; log session already opens the library when nothing is planned. The tab's own `useToday()` copy, used only by the old check, is gone. Test: `src/__tests__/render/gymLogButtonEveryDay.render.test.tsx`.
   - Re-check (Round 114): tsc exit 0; all 41 gym suites pass (158 tests); eslint clean on `gym.tsx` and both Fix 7 test files. The stale line-number comments in `gymStreakStripFootnote.render.test.tsx` now describe the current button rule.
8. **Copy the onboarding units into settings.** kg/lb and cm/ft are never written to the settings store (`measurements.tsx:57,68`).
   - Found (Round 115): units are already changeable in Settings: Profile > Preferences (`src/app/profile/preferences.tsx`) has a metric/imperial `SegmentedField` and one per dimension, saved through `useSettingsStore` (`setSystem`, `setUnit`; `units` in `src/lib/settings/store.ts`). The gap is the one named above: onboarding keeps kg/lb and cm/ft only in the onboarding store, so Preferences opens on the default (metric) units.
   - Done (Round 115): Continue on the measurements step also saves its weight and height units to the settings store (`setUnit`), so Preferences and every unit display start on the units picked in onboarding; no new Settings row or string (the existing Preferences row already switches metric/imperial). Checks: tsc exit 0; `src/__tests__/render/settingsUnits.render.test.tsx` red then green; 43 measurements, preferences and settings store suites pass (320 tests); eslint clean.
   - Re-checked (Round 116): tsc exit 0, 30 suites and 222 tests passed, eslint clean.
9. **Targets: Adjust recalculates the macros** so they add up to the new kcal (`targets.tsx:85`).
   - Fix 9 done (Round 117): Adjust saves the calorie target and the screen splits protein, carbs and fat from it through `deriveTargets` (new optional `calorie_target` input), so the macros add up to the new kcal. The backend mirrors it: `DeriveGoals` takes the same optional `CalorieTarget` and the onboarding POST (`pg.go`) splits the stored macros from it, so the plan does not change after onboarding. Tests: `onboardingTargetsAdjustMacros.render.test.tsx` red (macros 53% off 1,800 kcal) then green; 20 suites / 173 tests that mention targets pass; Go `TestDeriveGoals` new case "male moderate maintain adjusted to 1800" plus `tests/goals` and `tests/regression` pass.
   - Scope check (Round 118): commit `5aaa018` holds exactly the seven Fix 9 files plus the loop's own notes (`loop/DECISIONS_LOG.md`, `loop/NOTES_phase4.md`); nothing restored. tsc exit 0; 20 Jest suites / 173 tests pass; eslint clean on the three TS files; Go `tests/goals` and `tests/regression` pass. New real-Postgres test `backend/tests/goals/onboarding_calorie_target_pg_test.go` saves onboarding with 1800 kcal and checks the stored macros are within 2% of it: fails on the Round 116 `pg.go` (2,761 kcal), passes now against `lume_test_local`.
10. **Thinking of leaving: link Manage subscription and send the reason** through the existing feedback API, or drop the unsent survey (`leaving.tsx:70,89-103`).
   - Done (Round 119): a "Send reason" button posts the chosen reason through `api.feedback.post` as `{ category: 'account', message: 'leaving_reason:<key>' }` (an existing kind; the table's check constraint allows only bug, idea, account, other, so no backend change). It is disabled until a reason is picked and after a send, shows loading while sending, and toasts on success or failure. The optional note, which was never sent, is removed. Manage subscription (iOS) opens Apple's page through `openManageSubscription`. No analytics. Tests: `leavingSendReason.render.test.tsx` (idle, submitting, success, error, Manage subscription; analytics never called) and the existing leaving and locale parity suites, 4 suites / 15 tests pass; tsc 0; eslint clean.
11. **Food history day rows open that day** with `setSelectedDate`, the same way the calendar does (`history.tsx:150`).
   - Done (Round 120): food history day rows open that day.
12. **Food calorie card opens `/dashboard/nutrition`** (`food.tsx:709-752`).
   - Done (Round 122): the calorie card links to Nutrition for today only (option A). While the Food tab shows today the card opens `/dashboard/nutrition`; on any other day it is a plain card with no tap. Nutrition, its labels and the hooks are unchanged. Test: `src/__tests__/render/foodCalorieCard.render.test.tsx`.
13. Done (Round 123): Custom food saves the fibre typed in (a blank field stays unknown, not 0 g). The Food tab's "no matches" link passes the search's meal as `?slot`; with it, Save also logs 100 g to that meal through `logMeal(slotFromParam(slot), …)`, shows the "added to" toast and goes back to Food. Test: `src/__tests__/render/customFoodSave.render.test.tsx`.
14. **Saved dish: allow a portion change, then log** from the detail sheet (`detail.tsx:276-309`).
   - Done (Round 125): the saved-dish sheet offers serving presets scaled from the dish's own per-gram values, and a meal switch. Its primary pill ("Add to lunch") logs the portion on screen through `logMeal(slot ?? slotForNow(), draft, 'manual')`; an untouched portion logs the stored serving. "Save changes" is now the secondary pill and still rewrites the dish through `editSavedFood`. Test: `src/__tests__/render/foodDetailLogged.render.test.tsx`.
15. **AI consent returns to the screen that asked**, and ai-query's Back falls back when there is no history (`ai-consent.tsx:29,57`, `ai-query.tsx:73`).
   - Done (Round 126, 15a): a screen that replaces itself with consent passes itself as `?from` through `aiConsentHref` (`lib/nav.ts`); Insights does. Allow lands on `from`, or goes back when there is none. Not now and Back go back, so the asking screen cannot ask again; with no history all three fall back to the Food tab. `from` is accepted only as an app path. `Screen` forwards a new `onBack` to its back control. 15b (ai-query Back) is still open. Test: `src/__tests__/render/aiConsentScreen.render.test.tsx`.
   - Done (Round 127, 15b): Ask Lume's Back goes back when there is history and lands on the Food tab when there is none (deep link, entry screen), the same fallback as AI consent. The header and its look are unchanged. Test: `src/__tests__/render/aiQuery.render.test.tsx`.
16. **Insights shows its error state when the read fails**, not "no insights" (`insights.tsx:51`).
17. **The Food tab does not fetch insights before AI consent** (`food.tsx:202`).
18. **Streak freezes open `/gym/freeze`; Freeze explains why it is disabled at 0** (`streak.tsx:52-54`, `freeze.tsx:49,66`).
19. **Energy "add body stats" hint opens `/profile/goals`.** Training and Energy empty states link to Log gym (`energy.tsx:185`, `training.tsx:78-82`).
20. **One week rule.** Summary Workouts and the Training detail both count Monday to Sunday (`summaryCards.ts:58`, `training.tsx:114-117`).
21. **Gym month label counts this month's sessions**, not all time (`gym.tsx:166`).
22. **Week detail:** Net switches the hero chart, and a tapped bar shows that day's value (`week.tsx:126,169-206`).
23. **Nutrition chart title matches the chart** (7 days of grams). The new title goes into en.json only (`nutrition.tsx:144`).
24. **Drop the training-days step** from onboarding. Nothing reads it, and its default needs an extra tap (`training-days.tsx:2`).
25. **Profile: remove the rows repeated in Privacy and Subscription**, and keep one feedback path (`profile/index.tsx:199-212`).
26. **Barcode: look the code up once**, passing the result to detail (`barcode-scan.tsx:44`, `detail.tsx:108`).
27. **Muscles Back falls back to the Gym tab**, not Summary (`muscles.tsx:127`).
28. **Schedule with no workouts offers "Create a workout"** in the day picker (`schedule.tsx:174-188`).

### POST LAUNCH (major visual change, also listed in OWNER_CHECKS_phase4.md under "Post launch UI")

- A session detail screen, opened from Gym history rows and calendar days.
- Store every set in a session, not only the top set. This needs a backend shape change and new history and volume views (`session.tsx:159-175`).
- An entry point for recipes (`food/meals.tsx`, `food/new-recipe.tsx`), or removing the feature.
- Discoverable delete for a whole meal (long press only today, `food.tsx:765,823`).
- A visible step label in onboarding ("Step 3 of 10") in place of the dots.
- A per-muscle drill-down on the Muscles screen once per-muscle data exists.
