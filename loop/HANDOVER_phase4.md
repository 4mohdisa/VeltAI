Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first. The only git command allowed is git branch --show-current.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, or src/__tests__/foodDays.test.ts. English only: new keys go in en.json and on ENGLISH_ONLY in localeParity.test.ts. Never write "verified".
- Go DB tests: LUME_TEST_DATABASE_URL=postgres://mohammedisa@127.0.0.1:5432/lume_test_local?sslmode=disable. The six seed users are loaded there.

Rows
- Built: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 12, 12b, 29. No row was closed this session.
- Partial: 6b, 7, 8, 9 and 10.
- Last full run: tsc 0 errors; Jest 315 of 315 suites, 1,954 tests, 4 snapshots; 68 console.error, 163 console.warn.

In progress
- Row 10: wire NotificationSettingsList to device.ts. After a switch saves, check notificationPermission(). If granted, call applySchedule(scheduleNotifications(new Date(), timeZone, settings, mealLogTimes)). If not, only save, and never prompt.

Files
- Row 9 backend: backend/internal/retention/ (summary.go, handler.go, apple.go and tests), backend/tools/retention/main.go, routes in cmd/server/main.go. RETENTION_MESSAGING_ENABLED is off by default. GET /api/retention/summary is Pro gated.
- Row 9 app: src/app/profile/leaving.tsx, linked from src/app/profile/index.tsx with navigate().
- Row 10: src/lib/notifications/ holds types.ts, schedule.ts (pure), permissions.ts (prompts) and device.ts (permission read, applySchedule, REMINDER_PREFIX).
- Row 10 UI: src/components/domain/NotificationPriming.tsx, mounted in src/app/(tabs)/_layout.tsx, and NotificationSettingsList.tsx, mounted in Settings.
- Settings store: src/lib/settings/store.ts now holds notifications, setNotifications and hydrateNotificationSettings. The old NotificationPrefs was removed.

Decisions
- Only permissions.ts and device.ts import expo-notifications.
- The priming answer is kept across sign-outs, like the system permission. The notification settings are cleared on sign-out (resetRegistry), so a promotional opt-in never carries to the next account.
- Quiet hours: meal and streak reminders are dropped, workout and weekly reminders move to the quiet end. Yesterday is planned too, so a moved reminder isn't lost.
- The webhook does not check Apple's signature, because its reply is the same public message id for everyone.

Open for Isa
- Notification defaults, priming copy, and the quiet hours and label strings.
- Whether the switches can ship before scheduling works (App Store 2.1).
- Where the leaving reason and note go.
- The Apple retention owner steps.

Not fixed
- DECISIONS.md still names only permissions.ts as importing expo-notifications.
- Nothing derives per-slot meal logging times, nothing reschedules at app start or each day, and settings reload only when Settings opens. Quiet hours can't be edited.
- Skeleton render tests need a stand-in, because the test setup lacks reanimated's useReducedMotion.
- The route checks only see literal route strings.
- The paywall imports constants from a profile route file.
- entitlementFromApi stores an unknown status as it arrives.
- Today's pull-to-refresh doesn't refetch the subscription state.