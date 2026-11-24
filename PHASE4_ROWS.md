# Phase 4 rows

| number | area | what to do | files likely touched | test | status | notes |
|---|---|---|---|---|---|---|
| 1 | Foundation | Confirm branch loop/phase4, Node 22, .gitignore covers backend/.env, run full gates, write BASELINE_phase4.md, start local Postgres 17, create lume_test_local, run the 21 skipped TestPG tests | package.json, .gitignore, BASELINE_phase4.md | full gates, TestPG | BUILT | Step 2 done 25 Nov 2026 on Node 22.23.5: tsc 0 errors, Jest 242 suites and 1,397 tests pass, Go 34 packages ok with 21 TestPG skipped (no database), recorded in BASELINE_phase4.md. Step 3 done 25 Nov 2026: backend/.env is ignored, local PostgreSQL 17.10 started, lume_test_local created with all 18 migrations, 21 of 21 TestPG tests run and pass, 0 skipped |
| 2 | Phase 3 leftovers | Finish PHASE3_ROWS.md Rows 6, 13, 14, 15 and the items in loop/NOTES_phase3.md Parked and KNOWN_ISSUES.md; then set those rows built | src/lib/data, gym/schedule_pg.go, custom-food.tsx, ConfidenceBadge.tsx, goals screen | app Jest for changed files, Go for gym | DIFFERENT | |
| 2b | Sign up, sign in, onboarding redesign | Check Mobbin MCP availability, write DESIGN_REFERENCES.md, redesign welcome, sign in, sign up and onboarding (goal, diet, units, activity, training days), editable in Settings | auth and onboarding screens, DESIGN_REFERENCES.md | Jest per state, Maestro flow, en es fr | DIFFERENT | |
| 2c | Extra row built by Isa 25 Nov 2026 | Identify the work from the git log of 25 Nov 2026, describe it in one line, verify it | files from that commit | tests for that work | DIFFERENT | |
| 2d | Extra row built by Isa 25 Nov 2026 | Same as 2c for the second hand built item | files from that commit | tests for that work | DIFFERENT | |
| 3 | Sign in with Apple | Native Apple sign in through Clerk next to social login, equal prominence, all languages | sign in screen, auth wrapper | Jest mocked | DIFFERENT | |
| 4 | Account deletion | Settings delete, confirmation, backend deletes all user rows and Clerk user, sign out, table coverage test | Settings, backend delete handler | Go and Jest, table coverage test | DIFFERENT | |
| 5 | AI consent and limits | Consent screen before first scan or insight, stored with timestamp and version, Settings switch, backend refuses AI without consent, daily limits | consent screen, backend AI middleware, Settings | Go and Jest all states | DIFFERENT | |
| 6 | Entitlements backend | RevenueCat webhook to entitlement states, idempotent, out of order safe, middleware gate, route table test | backend billing and middleware | Go with real payload fixtures | DIFFERENT | |
| 7 | Paywall and purchase | RevenueCat wrapper, offers, store price and period, 7 day trial rules, restore, legal links, states, StoreKit file | paywall screen, purchase wrapper, StoreKit config | Jest with wrapper mocked, simulator flow | DIFFERENT | |
| 8 | Subscription lifecycle screens | Manage subscription, billing banner, expired with resubscribe, win back screen | subscription screens | Jest per state | DIFFERENT | |
| 9 | Cancel and retention | Thinking of leaving screen with reason survey, usage message from backend endpoint, Apple Retention endpoint behind a flag | cancel screen, retention endpoint | Go fixtures, performance test | DIFFERENT | |
| 10 | Notifications | Local schedules, priming screen after first value, per category switches, quiet hours, pure scheduling logic with fake clock | notification modules, settings | Jest fake clock across time zones and DST | DIFFERENT | |
| 11 | HealthKit | Read only provider interface, real and mock providers, purpose strings in all languages, Settings switch | health modules, Info.plist strings | Jest with mock provider | DIFFERENT | |
| 12 | Privacy manifest and plist review | PrivacyInfo.xcprivacy, reason APIs, data types matching PRIVACY_DATA.md, usage strings in all languages, check script | PrivacyInfo.xcprivacy, scripts | manifest check script | DIFFERENT | |
| 13 | Store content drafts | Update APP_STORE_METADATA.md in en, es, fr incl. health disclaimer and review notes | APP_STORE_METADATA.md | content review | DIFFERENT | |
| 14 | In app legal | Privacy policy, terms, health disclaimer screens or links, subscription terms on paywall | legal screens | Jest per screen | DIFFERENT | |
| 14a | Feature feedback | Thumbs chips after use, FEATURES config, throttle rules, backend feedback kind, Help screen extension, feature_rated event, feedback summary command | feedback modules, FEATURES config, backend feedback | Jest throttle with fake clock, Go | DIFFERENT | |
| 14b | Design intent audit | Write DESIGN_INTENT.md, smart defaults, contextual links, remove what does not earn its place | DESIGN_INTENT.md, affected screens | Jest per change, en es fr | DIFFERENT | |
| 15 | Backend test completeness | All TestPG run, go test -race, coverage per package, packages under 70 percent get table tests | backend test files | go test -race -cover | DIFFERENT | |
| 16 | Authorization and contract tests | Every route: 401 unauthenticated, user B blocked from user A data, validation, one error shape, route table test | backend route tests | Go | DIFFERENT | |
| 17 | Migration tests | Apply to empty and seeded databases, one migration per transaction, schema check, rollback and backup note | migrations, migration test | Go migration test | DIFFERENT | |
| 18 | Security pass | Auth, token expiry, webhook signatures, rate limits, injection fuzzing, upload limits, SSRF, headers, secrets scan, govulncheck, npm audit, SECURITY_TEST_REPORT.md | backend and app as needed | security tests, scans | DIFFERENT | |
| 19 | Load and performance | Local load test with 50 concurrent users, p50 p95 p99, EXPLAIN review, indexes by migration, PERF_BASELINE.md | load script, migrations | load run recorded | DIFFERENT | |
| 20 | AI contract tests | Gemini and Anthropic parse, timeouts, refusals, malformed output, fallbacks, cost in AI_TEST_LOG.md, max 30 live calls a day | AI client tests | Go with mocks and a few live calls | DIFFERENT | |
| 21 | Food data API tests | USDA and barcode fixtures, few live calls, rate limit, offline, unknown product, partial data, units | food data client tests | Go fixtures | DIFFERENT | |
| 22 | App test expansion | Coverage report, screen state matrix, en es fr parity, accessibility checks | test files | Jest | DIFFERENT | |
| 23 | Maestro end to end | Every tab and Phase 4 flow on small and large iPhone, light and dark, larger text, screenshots outside repo | .maestro flows | Maestro on simulator | DIFFERENT | |
| 24 | Failure injection | Backend down, slow network, 500s, token expiry, partial responses, clock change, offline writes sync once | sync and error handling | Jest and Maestro | DIFFERENT | |
| 25 | Data integrity | Day boundaries, DST streaks, unit rounding, unicode, leap day, concurrent edits, export and deletion completeness | data modules, tests | Jest and Go | DIFFERENT | |
| 26 | Seed data expansion | Users for every subscription state, consent and notification states, one command reset of local database | seed script | seed run on local database | DIFFERENT | |
| 27 | Memory and crash soak | Scripted flow for at least 2 hours on simulator, memory and crash watch, fix leaks, record in PERF_BASELINE.md | soak script | simulator soak | DIFFERENT | |
| 28 | Visual regression | Snapshots of key screens in light, dark, larger text, es, fr, compare script with tolerance | snapshot tests, compare script | snapshot compare | DIFFERENT | |
| 29 | Verify command and CI | npm run verify runs type check, lint, Jest, Go race, migration test, manifest check, i18n parity, secrets scan; CI workflow file locally only | package.json, .github/workflows | npm run verify | DIFFERENT | |
| 30 | Docs and handover | README, ARCHITECTURE, API route list, HOSTING_CHECKLIST, DOGFOOD, KNOWN_ISSUES, OWNER_CHECKS_phase4.md ordered by priority | docs | review | DIFFERENT | |
| 31 | Soak and bug hunt | Rotate bug hunting methods one per round; exit when 10 rounds in a row find no new bug and every gate is green | any | npm run verify | DIFFERENT | |

Progress: 1 of 36 rows BUILT or EXACT.
