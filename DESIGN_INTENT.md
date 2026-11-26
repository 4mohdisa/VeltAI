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
   - Still open: the scanner's "Photograph label" button does not pass the meal to label scan; a log from the detail sheet does not clear the Food tab's `?slot`.
   - Scan and label scan: open.
2. **Summary "Today" shows today.** The Summary macros card and Nutrition read the Food tab's selected day (`hooks.ts:320-321`). After the user looks at yesterday, Summary is wrong.
3. **Remove a set in a session.** "Log" prefills the planned sets (3 if none) and only "Add set" exists (`session.tsx:101,256,534-538`). Logging 1 of 3 sets is impossible.
4. **Prefill session sets from the last session**, not the plan (`session.tsx:100-105`). This is the most useful default at the gym.
5. **Resubscribe from Profile works after sign-out.** Winback opens the onboarding paywall, whose purchase runs `completeOnboarding` against a store that sign-out resets (`paywall.tsx:157-160`, `resetRegistry.ts:52`). Inferred from code: test this first.
6. **Sign in with no server record goes to goal, not measurements.** Today steps 1 to 4 are skipped, the paywall then fails with goal or activity missing, and Back goes to a preview that is not in the stack (`postAuth.ts:30,36`, `measurements.tsx:280`).
7. **A log entry on every Gym day.** The Gym tab's log button shows only when today has a scheduled workout (`gym.tsx:189`).
8. **Copy the onboarding units into settings.** kg/lb and cm/ft are never written to the settings store (`measurements.tsx:57,68`).
9. **Targets: Adjust recalculates the macros** so they add up to the new kcal (`targets.tsx:85`).
10. **Thinking of leaving: link Manage subscription and send the reason** through the existing feedback API, or drop the unsent survey (`leaving.tsx:70,89-103`).
11. **Food history day rows open that day** with `setSelectedDate`, the same way the calendar does (`history.tsx:150`).
12. **Food calorie card opens `/dashboard/nutrition`** (`food.tsx:709-752`).
13. **Custom food: save fibre, and log it when the user came from "no matches"** (`custom-food.tsx:38-47`).
14. **Saved dish: allow a portion change, then log** from the detail sheet (`detail.tsx:276-309`).
15. **AI consent returns to the screen that asked**, and ai-query's Back falls back when there is no history (`ai-consent.tsx:29,57`, `ai-query.tsx:73`).
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
