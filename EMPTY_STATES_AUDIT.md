# Empty States Audit (Phase 3, Row 4)

Read-only audit of loop/phase3 on 2026-11-22. No source changed. This covers every screen under src/app that can have no data, in six states: first use, no data for the day, filtered to nothing, error, offline and loading. A few rows also cover copy, save and cached-data states. States that cannot happen on a screen (no filter, no fetch, static content) are left out.

Verdicts: proper, blank, broken, placeholder, hard-coded English. No placeholder text was found.

Copy check: every t() key used in these states exists in en.json, es.json and fr.json (src/lib/i18n/locales). es.json has two extra keys that en.json lacks: addMenu.voice and addMenu.describeOutLoud.

Out of scope (Phase 4 or pure forms): onboarding/*, legal/*, profile/subscription, profile/delete-account, food/add and food/custom-food.

## Shared components and data hooks

These cause many of the screen rows below, so fixing them once fixes many screens.

| screen | state | current behaviour (file and line) | verdict |
|---|---|---|---|
| ErrorState (shared) | error | Default title "Something went wrong", message and "Retry" are literals (src/components/display/ErrorState.tsx:19-22) | hard-coded English |
| PendingSyncBanner (shared) | offline | Label and text "N change(s) waiting to sync" are literals (src/components/display/PendingSyncBanner.tsx:25,40) | hard-coded English |
| EmptyState, LoadFailedNotice, Skeleton (shared) | all | Take caller copy; LoadFailedNotice retry label uses t() (src/components/display/LoadFailedNotice.tsx) | proper |
| useHydration (src/lib/data/hooks.ts) | loading | Sets isLoading only on mount and refetch, never when the input changes (day switch, search term) (hooks.ts:53-85) | broken |
| useApi (src/lib/data/gymSchedule.ts) | error, offline | A failed fetch becomes the empty fallback with no error flag (gymSchedule.ts:41-49), so every gym hook reads as "no data" | broken |
| useEnergyRange (src/lib/data/energyRange.ts) | error, offline | Failed weeks become days=[] with no error flag (energyRange.ts:98-107) | broken |
| insights API (src/lib/api.ts) | error, offline | getInsights and getProfile swallow failures (api.ts:1253,1270) | broken |

## Food log

| screen | state | current behaviour (file and line) | verdict |
|---|---|---|---|
| Food tab | first use | EmptyState "No meals yet" + Add meal, translated (src/app/(tabs)/food.tsx:634-641) | proper |
| Food tab | no data for day | Day switch never sets isLoading, so "No meals yet" flashes before rows arrive (food.tsx:633-641, hooks.ts:53-85) | broken |
| Food tab | filtered to nothing | EmptyState "No matches" + Add custom food (food.tsx:613-620), but also flashes during the 250 ms debounce (hooks.ts:227-235) | broken |
| Food tab | error | ErrorState passes only a message, so title and Retry are English defaults (food.tsx:608-612, 621-625) | hard-coded English |
| Food tab | error with cached rows | LoadFailedNotice above rows, translated (food.tsx:482-484); copy says "today's" on past days | proper |
| Food tab | offline | Same path as error; no PendingSyncBanner on this screen | hard-coded English |
| Food tab | loading | SkeletonList for the day and search (food.tsx:604-607, 626-629) | proper |
| food/saved | first use | EmptyState food.savedEmptyTitle/Message (src/app/food/saved.tsx:98-103) | proper |
| food/saved | filtered to nothing | EmptyState noMatches + savedEmptySearchMessage (saved.tsx:100-102) | proper |
| food/saved | error | LoadFailedNotice plus "No saved foods yet" together when the store is empty (saved.tsx:94, 98-103) | broken |
| food/saved | offline | Same as error: claims no saved foods | broken |
| food/saved | loading | SkeletonList rows=4 (saved.tsx:96-97) | proper |
| SavedMealsList | first use | EmptyState savedMeals.emptyTitle/Message (src/components/food/SavedMealsList.tsx:87-94) | proper |
| SavedMealsList | error, offline | catch sets meals to [] so the empty state shows (SavedMealsList.tsx:50-55) | broken |
| SavedMealsList | loading | Two SkeletonCards while meals is null (SavedMealsList.tsx:78-85) | proper |
| RecipesList | first use | EmptyState "No recipes yet" / "New Recipe" literals (src/components/food/RecipesList.tsx:79-85) | hard-coded English |
| RecipesList | error, offline | catch sets [] so "No recipes yet" shows; log-failure toast literal (RecipesList.tsx:35-38, 62) | broken |
| RecipesList | loading | Two SkeletonCards (RecipesList.tsx:68-75) | proper |
| food/history | first use | EmptyState "No history yet" literal (src/app/food/history.tsx:122-126) | hard-coded English |
| food/history | no data for day | Row shows 0 kcal; "Today" / "Yesterday" literals (history.tsx:38-39, 148) | hard-coded English |
| food/history | error, offline | ErrorState with literal message plus English default title and Retry (history.tsx:110-120) | hard-coded English |
| food/history | loading | SkeletonList rows=5 (history.tsx:108-109) | proper |
| food/calendar | no data for day | No dot; title, subtitle and "Jump to today" literals (src/app/food/calendar.tsx:43,130) | hard-coded English |
| food/calendar | error, offline | Failed fetch draws no dots, same as nothing logged (src/lib/data/foodDays.ts:39-43) | blank |
| food/calendar | loading | No indicator; dots pop in (calendar.tsx:28) | blank |
| food/meals | copy | Header and segment labels literal (src/app/food/meals.tsx:30-58) | hard-coded English |
| food/new-recipe | first use | EmptyState "No ingredients yet" literal (src/app/food/new-recipe.tsx:143) | hard-coded English |
| food/detail | no subject | EmptyState food.nothingToShow (src/app/food/detail.tsx:134-143) | proper |
| food/detail | loading | SkeletonList, translated title (detail.tsx:146-151) | proper |
| food/detail | error, offline | Network failure shown as "Product not found" (detail.tsx:200-215, src/lib/scan.ts:377-385) | broken |
| food/barcode-scan | loading | "Looking up…" overlay literal (src/app/food/barcode-scan.tsx:147-149) | hard-coded English |
| food/barcode-scan | error, offline | Network failure shown as "Product not found", literals (barcode-scan.tsx:154-178) | broken |
| food/label-scan | loading | Spinner + "Reading label…" literal (src/app/food/label-scan.tsx:185-188) | hard-coded English |
| food/label-scan | error | English toast, zeroed form to fill by hand (label-scan.tsx:115-119, 152) | hard-coded English |
| food/label-scan | offline | Save queued; toast "will sync…" literal (label-scan.tsx:159-160) | hard-coded English |
| food/photo-capture | error | Toast "Couldn't take the photo" literal (src/app/food/photo-capture.tsx:78) | hard-coded English |
| food/quick-add | error | t('food.quickAddFailed') toast (src/app/food/quick-add.tsx:83) | proper |
| food/quick-add | offline | Create queued, t('food.quickAddOffline') (quick-add.tsx:89-96) | proper |

## Gym log and history

| screen | state | current behaviour (file and line) | verdict |
|---|---|---|---|
| Gym tab streak strip | first use | Footnote "N session(s) · N freeze(s)" is a literal (src/app/(tabs)/gym.tsx:160; the task text called this src/app/gym.tsx) | hard-coded English |
| Gym tab streak strip | error, offline | LoadFailedNotice t('gym.loadFailed') with retry; footnote hidden (gym.tsx:138, 158) | proper |
| Gym tab streak strip | loading | Shows "0 day streak" until hydration lands; only the footnote is guarded (gym.tsx:152-158) | broken |
| Gym tab GymCalendar | first use | monthSummary "0 sessions" literal; "Less/More" and a11y labels literal (src/lib/data/gymRange.ts:199, src/components/domain/GymCalendar.tsx:64-69,138,154,197-205) | hard-coded English |
| Gym tab GymCalendar | error, offline, loading | Summary shows t('gym.monthLoadFailed') or t('gym.loadingSessions') (gym.tsx:72-76) | proper |
| Gym tab TodayCard | first use, rest day | Translated rest card (src/components/gym/TodayCard.tsx:260-271) | proper |
| Gym tab TodayCard | error, offline | LoadFailedNotice with retry (TodayCard.tsx:254) | proper |
| Gym tab TodayCard | loading | Skeleton card (TodayCard.tsx:241-249) | proper |
| Gym tab MuscleChart, GymPatternsCard | first use | Patterns translated; MuscleChart "Log workouts to see…", "Muscle focus", "Last 30 days" literal (src/components/gym/MuscleChart.tsx:134,137,161) | hard-coded English |
| Gym tab MuscleChart, GymPatternsCard | error, offline | Error swallowed into null, shows the first-use prompts (gymSchedule.ts:47-49) | broken |
| Gym tab MuscleChart, GymPatternsCard | loading | Skeletons (MuscleChart.tsx:114-124, src/components/gym/GymPatternsCard.tsx:79-89) | proper |
| Gym tab MyScheduleCard | first use, error, offline, loading | Returns null in every one of these states (src/components/gym/MyScheduleCard.tsx:28,37) | blank |
| gym/templates | first use | Eyebrow "Gym", title "My workouts", "New workout" label, empty-state title/message/action literal; list "exercise(s)", "about N min" literal (src/app/gym/templates.tsx:25-29, 40-46, 62-63) | hard-coded English |
| gym/templates | error, offline | Error swallowed into [], shows "No workouts yet" (gymSchedule.ts:47, templates.tsx:39) | broken |
| gym/templates | loading | Two Skeletons (templates.tsx:34-38) | proper |
| gym/history | first use | EmptyState "No sessions yet", title "Session history" literal (src/app/gym/history.tsx:23,27-31) | hard-coded English |
| gym/history | error, offline | useGym error ignored, shows "No sessions yet"; local echo date 'Today' literal (history.tsx:17-26, src/lib/data/gymStore.ts:99) | broken |
| gym/history | loading | SkeletonList rows=4 (history.tsx:25) | proper |
| gym/streak | first use | Title "Streak", "Longest/Sessions/Freezes" literal (src/app/gym/streak.tsx:20,27-29) | hard-coded English |
| gym/streak | error, offline, loading | No checks; renders 0 / 0 / 0 as real (streak.tsx:16-33) | broken |
| gym/freeze | first use | "Use 1 of your 0 freezes for today?" with Done disabled (src/app/gym/freeze.tsx:41-47) | broken |
| gym/freeze | error, loading | No checks; shows 0 freezes and Done disabled (freeze.tsx:18-20, 41) | broken |
| gym/freeze | offline | Success toast while the call is only queued (freeze.tsx:36-38) | broken |
| gym/exercise-progress | first use | EmptyState "Not enough data yet", "History", guide and stat labels literal (src/app/gym/exercise-progress.tsx:47-56,175-177,208) | hard-coded English |
| gym/exercise-progress | filtered to nothing | Library name miss hides the muscles card and subtitle silently (exercise-progress.tsx:165,279-285) | blank |
| gym/exercise-progress | error, offline | Read fails to null, shows "Not enough data yet" (exercise-progress.tsx:180-187) | broken |
| gym/exercise-progress | loading | Skeleton for history (exercise-progress.tsx:168-170) | proper |
| gym/muscles | first use | EmptyState "No muscle data yet", "Muscle focus", "Go back" literal (src/app/gym/muscles.tsx:68-69,124,142) | hard-coded English |
| gym/muscles | error, offline | Null patterns show "No muscle data yet" (muscles.tsx:41,64-71) | broken |
| gym/muscles | loading | Two Skeletons (muscles.tsx:55-61) | proper |
| gym/schedule | first use | No templates: sheet offers only literal "Rest day / Nothing scheduled"; day labels literal (src/app/gym/schedule.tsx:26,135-140,163-177) | hard-coded English |
| gym/schedule | error, offline | Schedule becomes [], empty card under the title; failed-write toast literal (schedule.tsx:74,83,94-148) | blank |
| gym/schedule | loading | Seven Skeletons (schedule.tsx:85-90) | proper |
| gym/new-template | first use | Prompt, field labels, "Save workout" literal (src/app/gym/new-template.tsx:127,136-166) | hard-coded English |
| gym/new-template | error, offline | Edit prefill fails silently into "No exercises on this workout."; save toast literal (new-template.tsx:77-79,116,166) | broken |
| gym/new-template | loading | Edit mode shows "No exercises on this workout." until fetched (new-template.tsx:52-83,166) | broken |
| gym/log-session | rest day | Redirects to the session picker (src/app/gym/log-session.tsx:172-174) | proper |
| gym/log-session | error, offline | LoadFailedNotice with retry (log-session.tsx:161-167) | proper |
| gym/log-session | loading | Skeleton in the sheet (log-session.tsx:151-157) | proper |
| gym/log-session | copy | SomeOfItSheet strings literal (log-session.tsx:309-400) | hard-coded English |
| gym/session | no data for day | EmptyState "Rest day / Nothing scheduled", "Add an exercise" literal (src/app/gym/session.tsx:578-584) | hard-coded English |
| gym/session | error, offline | Null today shows "Nothing scheduled", unlike log-session (session.tsx:577-584) | broken |
| gym/session | loading | Three Skeletons (session.tsx:571-576) | proper |

## Goals and progress

| screen | state | current behaviour (file and line) | verdict |
|---|---|---|---|
| Summary tab | first use | Energy "Nothing logged or burned yet…" and workouts "No sessions yet this week" literal (src/components/domain/EnergyBalanceCard.tsx:218, src/lib/data/summaryCards.ts:68) | hard-coded English |
| Summary tab | no data for day | "No energy data for today yet."; fibre "Not tracked · target" literal (src/components/domain/EnergyBalanceCard.tsx:190, src/components/domain/MacroBars.tsx:53) | hard-coded English |
| Summary tab | error | Streak and macros use translated LoadFailedNotice (src/app/(tabs)/index.tsx:115,155); energy, week and workouts cards literal (src/components/domain/WeekEnergyCard.tsx:77, src/components/domain/WorkoutsWeekCard.tsx:28) | hard-coded English |
| Summary tab | offline | Only PendingSyncBanner (literal), then the error copy above | hard-coded English |
| Summary tab | loading | Skeletons (index.tsx:106-111,151-153), but GymStatusCard offers "Log gym session" from seed before the read (index.tsx:175, gymStore.ts:65) | broken |
| dashboard/nutrition | first use | t('nutrition.noMealsToday'); week chart draws flat bars under a "1g" ceiling (src/app/dashboard/nutrition.tsx:81,144,199) | broken |
| dashboard/nutrition | no data for day | Fibre no logged food carries shows a dash, not 0 g (useFibreConsumed, nutrition.tsx:83,198); data still follows the Food tab's selected date, not today (hooks.ts:307) | broken |
| dashboard/nutrition | error, offline | Food-log notice shown (nutrition.tsx:106); a failed week read shows LoadFailedNotice dashboard.weekMacrosLoadFailed with Retry instead of the zero-bar chart (nutrition.tsx:143) | proper |
| dashboard/nutrition | loading | While the first read runs with nothing stored, the kcal number and Breakdown values show a dash and the meal list a skeleton, not "No meals today" (nutrition.tsx:112,191-192,205) | proper |
| dashboard/plan | first use, no data | EmptyState plan.emptyTitle/emptyMessage; plan is static (src/app/dashboard/plan.tsx:34-39) | proper |
| dashboard/training | first use, no data for day | EmptyState trainingNoSessions; "rest day" or "—" in breakdown (src/app/dashboard/training.tsx:74-79,146-151,220-221) | proper |
| dashboard/training | error, offline | Failed sessions read (useGymRange error) shows LoadFailedNotice gym.loadFailed with Retry (training.tsx:76); failed energy read shows LoadFailedNotice dashboard.energyLoadFailed with Retry in the energy card (training.tsx:195) | proper |
| dashboard/training | loading | Skeletons (training.tsx:69-73,178-179) | proper |
| dashboard/week | first use, no data for day | EmptyState weekNoDays; null net draws a gap and "—" (src/app/dashboard/week.tsx:73-78,120,296) | proper |
| dashboard/week | error, offline | Both energy reads failing (useEnergyRange isError) shows LoadFailedNotice dashboard.energyLoadFailed with Retry (week.tsx:75) | proper |
| dashboard/week | loading | Skeletons (week.tsx:68-72) | proper |
| energy | first use, no data for day | EmptyState energyNoData; kcal eaten + body stats prompt (src/app/energy.tsx:72-77,174-180) | proper |
| energy | error, offline | Both energy reads failing (useEnergyRange isError) shows LoadFailedNotice dashboard.energyLoadFailed with Retry (energy.tsx:74) | proper |
| energy | loading | Skeletons (energy.tsx:67-71) | proper |
| insights | first use | EmptyState "Lume is learning" / "No insights yet" literal (src/app/insights.tsx:86-96) | hard-coded English |
| insights | filtered to nothing | Dismissing every card falls into the same literal empty state (insights.tsx:84) | hard-coded English |
| insights | error, offline | Failures swallowed, shows "No insights yet" and a fixed 0.3 progress bar (api.ts:1253,1270, src/components/ai/BrainProfileCard.tsx:70) | broken |
| insights | loading | Skeletons (insights.tsx:78-83); before consent an empty body under literal "Insights" (insights.tsx:35-40) | hard-coded English |
| profile/goals | first use | No onboarding data: calorie floor and 0 g protein shown as "Set by Lume" (src/app/profile/goals.tsx:125, src/lib/onboarding/deriveTargets.ts:73-75) | broken |
| profile/goals | error, offline | useGoals() error dropped, derived defaults shown with no notice (goals.tsx:48, hooks.ts:443-446) | broken |
| profile/goals | loading | No skeleton; numbers change in place when the fetch lands (goals.tsx:48-49) | broken |
| profile/goals | save | Custom goals saved to an in-memory store only, lost on restart despite "Saved as you type" (src/lib/settings/store.ts:1-5, goals.tsx:198) | broken |
| profile/goals | copy | Eyebrow "Daily targets" literal (goals.tsx:94) | hard-coded English |

## Profile

| screen | state | current behaviour (file and line) | verdict |
|---|---|---|---|
| profile/index | first use | Name eyebrow omitted when empty; streak stats show real 0s (src/app/profile/index.tsx:110) | proper |
| profile/index | error, offline | LoadFailedNotice t('profile.loadFailed') with retry above local values (index.tsx:104) | proper |
| profile/index | loading | isLoading never read; stats show 0 until data arrives (index.tsx:74-78) | broken |
| profile/integrations | first use | Provider cards with Connect; eyebrow "Nothing connected" literal (src/app/profile/integrations.tsx:126,246) | hard-coded English |
| profile/integrations | error, offline | Failed list read becomes [], every provider reads "not connected"; toasts literal (integrations.tsx:90-95,142-171) | broken |
| profile/integrations | loading | Two skeletons; eyebrow "Sync" literal (integrations.tsx:124,183-187) | hard-coded English |
| profile/preferences | first use | Local unit defaults (src/app/profile/preferences.tsx:26) | proper |
| profile/preferences | save | Choices kept in memory only, lost on restart (src/lib/settings/store.ts:1-5) | broken |
| profile/preferences | copy | Eyebrow "Units" literal (preferences.tsx:32) | hard-coded English |
| profile/account | first use, error | Empty profile: name field and Email row blank (src/app/profile/account.tsx:25-26,70) | blank |
| profile/account | loading | useState(profile.name) reads the name once at mount, so a late load never fills it (account.tsx:26) | broken |
| profile/account | offline | Toast "Saved on this device — could not reach the server." literal (account.tsx:40) | hard-coded English |
| profile/account | copy | "Account", "Your details", "Display name", "Email", "Name updated." literal (account.tsx:38,49-50,68,70) | hard-coded English |
| profile/privacy | loading | AI section hidden while consent is null (src/app/profile/privacy.tsx:19,80) | blank |
| profile/privacy | error | Rejected hasAiConsent() not caught, AI section never shows (privacy.tsx:23) | broken |
| profile/privacy | error, offline (export, withdraw) | Error toasts literal (privacy.tsx:36,53) | hard-coded English |
| profile/scan-calibration | first use | EmptyState "No scans yet" literal (src/app/profile/scan-calibration.tsx:81-85) | hard-coded English |
| profile/scan-calibration | no data | Scans logged but none corrected still says "No scans yet" (scan-calibration.tsx:75-79) | broken |
| profile/scan-calibration | filtered to nothing | Foods under 3 samples dropped; section hides (scan-calibration.tsx:76,129) | proper |
| profile/scan-calibration | error, offline | failed and empty share one branch, shows "No scans yet" (scan-calibration.tsx:47-49,79) | broken |
| profile/scan-calibration | loading | Three skeletons (scan-calibration.tsx:61-66) | proper |
| profile/support | error | Mail failure toast literal; "Email support" row fails silently (src/app/profile/support.tsx:26,33) | hard-coded English |
| profile/support | copy | "Support", "Help", "Send feedback", placeholder literal (support.tsx:30,39-45) | hard-coded English |
| profile/about | copy | "About", tagline, "Version", "Build", "Credits" literal (src/app/profile/about.tsx:14-28) | hard-coded English |

## Search results

| screen | state | current behaviour (file and line) | verdict |
|---|---|---|---|
| Food tab search | filtered to nothing | EmptyState "No matches", flashes during the 250 ms debounce (food.tsx:613-620, hooks.ts:227-235) | broken |
| Food tab search | error | ErrorState with English default title and Retry (food.tsx:608-612) | hard-coded English |
| Food tab search | loading | SkeletonList (food.tsx:604-607) | proper |
| food/new-recipe ingredient search | first use | No recents: empty Card under the field; recents come from the selected day only (new-recipe.tsx:65,205-236, hooks.ts:274) | blank |
| food/new-recipe ingredient search | filtered to nothing | Empty Card, no "no matches" (new-recipe.tsx:205-236) | blank |
| food/new-recipe ingredient search | error, offline | useFoodSearch error not read, empty Card (new-recipe.tsx:64) | blank |
| food/new-recipe ingredient search | loading | isLoading ignored; old or empty rows shown (new-recipe.tsx:64) | blank |
| ExercisePicker | filtered to nothing | "No exercises found", placeholder, pills and title literal (src/components/gym/ExercisePicker.tsx:24,77,106,158-160) | hard-coded English |
| ExercisePicker | error, offline | Library fetch swallowed into [], shows "No exercises found" (gymSchedule.ts:110, ExercisePicker.tsx:147-160) | broken |
| ExercisePicker | loading | Three Skeleton rows (ExercisePicker.tsx:150-156) | proper |
| ai-query (Ask Lume) | first use | Prompt and suggestion chips literal (src/app/ai-query.tsx:20-25,89) | hard-coded English |
| ai-query (Ask Lume) | no data | not_enough_data answer literal (src/lib/data/aiBrain.ts:138) | hard-coded English |
| ai-query (Ask Lume) | filtered to nothing | Empty answer with unavailable false renders nothing (ai-query.tsx:117) | blank |
| ai-query (Ask Lume) | error | "AI analysis unavailable" literal; 503 server message dropped because unavailable is checked first (ai-query.tsx:96-104, src/lib/data/aiBrain.ts:158) | broken |
| ai-query (Ask Lume) | offline | Same literal "unavailable" copy (ai-query.tsx:96-104) | hard-coded English |
| ai-query (Ask Lume) | loading | TypingIndicator (ai-query.tsx:92-95) | proper |
