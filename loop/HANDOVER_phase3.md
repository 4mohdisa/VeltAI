HANDOVER: Lume Phase 3, branch loop/phase3

ROWS (PHASE3_ROWS.md)
Rows 1 to 4 built. Row 5 partial (Maestro part needs Isa). Row 12 done, awaiting Isa's "built". Row 13 (Food log) PARTIAL, notes up to Round 81. Row 14 (Gym) DIFFERENT, notes Rounds 82 to 84. No row newly built this session.

ROW 13 DONE THIS SESSION
- calendar.tsx and WeekStrip translated (calendar block).
- meals.tsx and saved.tsx headers fixed (comments only).
- Food tab shows PendingSyncBanner.
- food/detail.tsx: both not-found states have a Done action.

ROW 14 DONE
- gym/session.tsx: failed read shows LoadFailedNotice with Retry; all strings translated (gymSession block).
- gym/history.tsx: same notice pattern; translated (gymHistory block).

IN PROGRESS
Nothing half-done. Next screen: src/app/gym/templates.tsx (failed read shows "No workouts yet"; literals).

KEY FILES
src/app/gym/session.tsx, history.tsx; src/app/food/detail.tsx, calendar.tsx; src/components/food/WeekStrip.tsx; src/app/(tabs)/food.tsx; locales en/es/fr.json. Tests in src/__tests__/render: gymSession.emptyStates, gymHistory.emptyStates, WeekStrip, calendar.strings, foodTab.emptyStates, foodDetailLogged.
Last full checkpoint (round 73): 156 suites, 1056 tests, 0 failed.

DECISIONS
- Failed reads use LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch}, copying log-session.tsx.
- Locale blocks are inserted as text after the previous new block.
- Identical text reuses existing keys (gym.sessionHistory, dashboard.trainingNoSessionsTitle, common.done). For session.tsx only, the brief limited reuse to the gym namespaces.
- No data-layer changes (src/lib/data is off limits).

BLOCKED (Isa)
- es and fr wording of all new blocks.
- lookupBarcodeAsync (src/lib/data/scan.ts) can't tell not-found from offline.
- useLoggedDays has no error.
- WeekStrip keys for ", today" and Previous/Next week.
- Add-an-exercise while today's read failed.
- /food/meals reachable only via the new-recipe fallback.
- Whether the banner should count all queued writes or only food ones.
- Simulator offline check of the Food banner.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first. No git, no Prettier. Maestro is not installed.
- In zsh, pass multi-file jest lists through xargs.
- The API client retries GETs on network or 5xx errors; tests use a 400 response for an instant failure.
- Dev builds seed mock gym sessions on gymStore reset; set sessions: [] to test the release-like empty state.
- findAll matches nested Text three times; filter on typeof n.type === 'string'.

UNFIXED / NEXT
- Date helpers use the device locale; formatRelativeDate is hardcoded English.
- GymCalendar and WeekEnergyCard weekday letters are hardcoded.
- No test checks en/es/fr key parity.
- One French straight apostrophe.
- Hardcoded "Close" label in SheetContent.
- session.tsx "Progress saved" and "Save" in its alert are still English.
- The Food tab hidden-banner test checks only the alert role.
- meals.tsx line 2 is 82 characters.
- saved.tsx line 1 says "C13 · My dishes".