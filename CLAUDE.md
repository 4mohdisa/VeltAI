@AGENTS.md

## Phase 2 rules (these override the Loop rules above)
- Work only on the loop/phase2 branch. Never push, merge or switch branches. The loop script handles git.
- Progress is tracked in PHASE2_ROWS.md. The design is final: do not restyle screens.
- Local only: the app and tests use the local backend and a local database. Never touch production Supabase, Clerk, RevenueCat or any hosted data.
- Secrets never go in the repo. Test account credentials come from the E2E_EMAIL and E2E_PASSWORD environment variables.
- Backend changes are allowed when a row needs them: the smallest change, with a test.
- End every task with a report in the format DONE, CHECKED, BLOCKED, NEXT.

## Phase 3 rules (these override the Phase 2 and Loop rules above)
- Work only on the loop/phase3 branch. Never push, merge or switch branches. The loop script handles git.
- Progress is tracked in PHASE3_ROWS.md. The design is final except the named Phase 3 rows (empty states, workout plus button, new Settings screens).
- Local only: the app and tests use the local backend and a local database. Never touch production Supabase, Clerk, RevenueCat, Sentry, PostHog or any hosted data.
- Secrets never go in the repo. Sentry and PostHog keys come from environment variables and do nothing when missing. Test accounts come from E2E_EMAIL and E2E_PASSWORD.
- Analytics events carry names and counts only, never food, health, body or workout values, never email or free text.
- Every new or changed string goes into all supported languages.
- Phase 4 work (Sign in with Apple, account deletion, AI consent and limits, subscriptions, push, HealthKit, store content) is out of scope. Park it.
- Jest stays pinned to ~29.7.0. Use Node 22 once the Node 22 row is done.
- End every task with a report in the format DONE, CHECKED, BLOCKED, NEXT.
