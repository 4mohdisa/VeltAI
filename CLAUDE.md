@AGENTS.md

## Phase 2 rules (these override the Loop rules above)
- Work only on the loop/phase2 branch. Never push, merge or switch branches. The loop script handles git.
- Progress is tracked in PHASE2_ROWS.md. The design is final: do not restyle screens.
- Local only: the app and tests use the local backend and a local database. Never touch production Supabase, Clerk, RevenueCat or any hosted data.
- Secrets never go in the repo. Test account credentials come from the E2E_EMAIL and E2E_PASSWORD environment variables.
- Backend changes are allowed when a row needs them: the smallest change, with a test.
- End every task with a report in the format DONE, CHECKED, BLOCKED, NEXT.
