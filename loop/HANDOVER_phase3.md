HANDOVER: Lume Phase 3, branch loop/phase3

ROWS
- Row 9 (Export my data) is BUILT. The owner check is pending: run the export on the seeded heavy user with a real sign-in.
- Row 8 (analytics) is PARTIAL and Row 10 (help and feedback) is PARTIAL.
- The Row 8 host item in PRIVACY_DATA.md has matched the code since round 204. The loop keeps resending it from an old copy; answer with "already matches".

BUILT
- Row 9: GET /api/export already existed (backend/internal/auth/export.go). Added backend/internal/auth/export_test.go: 401, 429, and a real-database user A/B test (passed in round 211). Added an Export row to the main Settings list (src/app/profile/index.tsx) with test src/__tests__/render/settingsExport.render.test.tsx.
- Row 10 backend: POST /api/feedback in backend/internal/feedback/ (validate.go, store.go, handler.go, feedback_test.go). Migration supabase/migrations/20261123000001_feedback.sql. Route registered in backend/cmd/server/main.go.
- Row 10 screen: src/app/profile/feedback.tsx, api.feedback.post in src/lib/api.ts, feedback.* keys in en, es and fr. Test src/__tests__/render/feedback.render.test.tsx passes 7 of 7.
- SettingsList now passes accessibilityHint through on link rows.

IN PROGRESS
Row 10 Settings row: nothing opens /profile/feedback yet.

LAST GATES
Round 215: tsc 0 errors; Jest 203 suites and 1218 tests passing. Round 218 checked only tsc and the new tests.

DECISIONS
- Reuse before building. Export and debugreports already existed.
- Test migrations only on throwaway databases (deploy/migrate.sh plus the auth setup from the backend/tests/food/days_pg_test.go header), then drop them. No local database is clearly Lume's.
- Feedback uses the shared auth and limiter (write class, 120 a minute). No second limiter.

WAITING ON ISA
- Permission to add {"feedback", ownedRows("feedback")} to export.go. Without it, backend/tests/migrations TestExportCoversEveryUserTable fails. Round 217 was said to have added it; it did not.
- Hosted feedback migration, which local database Lume uses, and the Row 9 owner check.
- Privacy footer says "First-party only"; analytics on by default or opt-in; which device fields PostHog gets; feature_used strict list; PostHog key and EU host.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22. No git, Prettier or Maestro. zsh rejects grep --include.
- Local Postgres 17 is normally stopped. Start it with pg_ctl -D /opt/homebrew/var/postgresql@17 and stop it afterwards.
- Profile render tests must mock StreakCounter (reanimated).
- The loop's prompts often rely on stale facts; check them against the files first.

UNFIXED
- There are two Export rows: Privacy (hard-coded English) and the main Settings list. The Privacy one stays until the Row 15 copy pass.
- Support has its own mail-based feedback box.
- PRIVACY_DATA.md does not list feedback.
- Export runs about 33 queries but counts as one read for rate limiting.
- Export is shared as text, not a file.
- A bad PostHog host turns PostHog off with no log line.
- The feedback app_version is the version label with the build number ("1.4.0 (12)").
- Destructive Settings rows have a hard-coded English hint.

NEXT
Get the export.go approval, then add the Settings row for /profile/feedback.