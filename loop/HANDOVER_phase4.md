Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first. The only allowed git command is git branch --show-current.
- Protected files: src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, src/__tests__/foodDays.test.ts.
- Strings are English only: en.json plus ENGLISH_ONLY in localeParity.test.ts. Never write "verified". Use --ci and never -u.
- Go tests: LUME_TEST_DATABASE_URL=postgres://mohammedisa@127.0.0.1:5432/lume_test_local?sslmode=disable.

Rows
- No row was closed this session. Row 10 is still PARTIAL, and the rows listed as built at the start are unchanged.
- Last full run (Round 54): tsc 0 errors; Jest 320 of 320 suites, 1,992 tests, 4 snapshots; 68 console.error, 164 console.warn matches (82 real warning blocks).

Row 10 built
- Settings switches and quiet hours editing: src/components/domain/NotificationSettingsList.tsx. Quiet hours use a Stepper (15 minutes a step) in a BottomSheet; an equal start and end shows an error and isn't saved.
- Daily reschedule at app start and on foreground: src/lib/notifications/daily.ts, called from src/app/_layout.tsx. The day key is cleared on sign-out.
- Meal reminders use the user's real meal times: src/lib/notifications/mealTimes.ts, fed by fetchWeekLogs in src/lib/data/hooks.ts.
- Sign-out (src/lib/auth/resetRegistry.ts) clears reminders (clearReminders in device.ts) and removes the push token (pushToken.ts).
- A grant on NotificationPriming.tsx reschedules today and registers the push token.
- Backend 10c: backend/internal/push, POST and DELETE /api/push/token, migration 20261127000001_push_tokens.sql (applied to lume_test_local), and push_tokens added to account deletion and the export.

Decisions
- Only permissions.ts and device.ts import expo-notifications.
- Every reschedule goes through rescheduleToday or runDailySchedule. Neither ever prompts.
- Meals inside quiet hours are dropped (decided).
- DELETE /api/push/token is public, so a lapsed account can stop push. A token moves to whichever account registers it last. The export omits the token itself.
- The shared API client accepts a 204 with no body.
- The node Jest project maps expo-notifications to src/__tests__/mocks/expoNotifications.ts (in package.json), and src/__tests__/render/setup.ts mocks it for render tests.

Open for Isa
- The UTC fallback when the device time zone can't be read.
- Whether to reschedule the same day once permission is granted later.
- The quiet hours step and wording, and that quiet hours can't be turned off.
- The push token retention period, and whether DELETE should stay public.

Not fixed
- The push token is kept in memory only, so after a relaunch sign-out can't remove it. This is the recommended next task.
- A DELETE sent after the session has ended gets a 401 and leaves the server row.
- The node expo-notifications mock lacks getDevicePushTokenAsync.
- The quiet hours stepper doesn't wrap past midnight, and late snacks around midnight don't wrap either.
- Stepper's "Decrease" and "Increase" screen-reader labels are hardcoded English.
- src/__tests__/render/notificationSettingsList.wiring.render.test.tsx changed on disk after its last run. Rerun it before trusting the Round 55 result.