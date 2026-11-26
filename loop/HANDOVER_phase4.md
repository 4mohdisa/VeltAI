Handover: Lume Phase 4, branch loop/phase4

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first, then npx tsc --noEmit (0 errors now).
- Run Jest as perl -e 'alarm N; exec @ARGV' npx jest --ci <full paths>, with output sent to /tmp. Never use -u, never run Prettier --write.
- en.json is src/lib/i18n/locales/en.json. Each new key also goes at the end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- Protected files: src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, the listSessions defaults in src/lib/api.ts, src/__tests__/foodDays.test.ts.

Rows
- PHASE4_ROWS.md was not updated this session. BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10-14, 29. PARTIAL: 6b, 7, 8, 9, 14a.
- Row 14b (DESIGN_INTENT.md Fix list) is in progress. Fixes 1-18 are done, and each has a Done line.
- Fix 19: Energy and Training empty states now link to /gym/log-session. The Energy body stats hint is parked: its copy says "in onboarding", and /profile/goals has no weight or height fields.
- Fix 20: the helper is the existing weekOf in src/lib/data/foodDays.ts, pinned in src/__tests__/weekRange.test.ts. Summary Workouts already used it.

In progress: Fix 20, second half
- src/app/dashboard/training.tsx now counts the week as weekOf(today), Monday to today. Its test is the new src/__tests__/render/training.render.test.tsx.
- The detailChrome.render.test.tsx training snapshot fails, as expected. Refreshing it needs Isa's approval for -u on that one file.
- Once refreshed, add the Fix 20 Done line.
- Last full green suite: Round 139, 348 suites, 2,171 tests.

Decisions
- Fix numbers in prompts ran one ahead of DESIGN_INTENT.md, so Done lines follow the file's numbers:
  - The Welcome Sign in fix sits under Fix 6.
  - The Food tab insights consent gate sits under Fix 17.
- Ask Lume keeps its own header. Its Back falls back inline, the same way ai-consent.tsx does.
- AI consent: decline and Back go back, because returning to Insights would ask for consent again. Allow goes to the screen that asked (?from=).
- Screen got an onBack prop.

Gotchas
- Welcome imports Clerk. Any test that renders it must mock @clerk/clerk-expo, or Jest hangs.
- Skeleton needs reanimated's useReducedMotion. Tests mock LoadingSkeleton.
- Use jest.useFakeTimers({ now, doNotFake: [...] }) to pin the date, so setImmediate still runs.

Open problems
- The Training "This week" energy card still uses the last 7 days. training.axisLetters uses a fixed September fixture.
- A Jest worker is force-exited at the end of every full run.
- Energy's "not enough days" empty state has no action.
- gym.freeze.confirm says "1 freezes" (no plural forms).
- The back-or-Food fallback is copied in two files. GlassButtons falls back to Today.
- The Food tab checks consent only once, when it mounts.
- The saved list does not pass the meal slot to the detail sheet.
- Isa rulings pending: Fix 24, Fix 25, Fix 12 option B, and the body stats hint.