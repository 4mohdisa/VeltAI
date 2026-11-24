Handover: Lume Phase 4, branch loop/phase4

Setup
Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first. Run no git commands; the loop script commits. Never connect to 127.0.0.1:55432 or print LUME_TEST_DATABASE_URL. Do not edit src/lib/mock/data.ts or src/__tests__/helpers/useApiHarness.ts. Do not change the api.ts listSessions defaults.

Rows
Row 1 is BUILT. Row 2 is PARTIAL, with 2.3 (strings) in progress and 2.4 and 2.5 not started. Row 29 is DIFFERENT: the parity test exists but npm run verify does not. No row became BUILT this session.

Done this session (2.3)
- Week range separator, nutrition gram unit, footnote sentence and meal line.
- Custom food "Save food" label.
- Energy and week screens follow the kcal/kJ setting.
- weekTarget merged into energyTarget.
- ConfidenceBadge "no breakdown" sentence, with a render test.
- workoutsWeek uses weekdayLetter.
- localeParity.test.ts, which checks keys, placeholders and _one/_other plurals.
Last checkpoint: tsc 0 errors; Jest 257 suites, 1,507 tests, 4 snapshots, all pass. No component is half done.

Key files
- src/app/energy.tsx, src/app/dashboard/{week,nutrition}.tsx, src/app/food/custom-food.tsx
- src/components/food/scan/ConfidenceBadge.tsx
- src/lib/units.ts (formatEnergy, kcalToDisplay, UNIT_OPTIONS)
- src/lib/settings/store.ts (useUnitPreferences, setUnit)
- src/lib/data/{energyRange,summaryCards}.ts
- src/lib/i18n/locales/{en,es,fr}.json
- src/__tests__/localeParity.test.ts and src/__tests__/render/*Unit*, *rangeSeparator*, nutrition*, confidenceBadge.*
- PHASE4_ROWS.md (row 2 notes cell) and OWNER_CHECKS_phase4.md (append only)

Decisions and why
- Energy values in sentences use formatEnergy, so the unit lives in the value. Bare numbers use formatNumber(kcalToDisplay()). Unit labels use {{unit}}. This keeps the kcal view identical, and no snapshot changed.
- Key names were kept even where now misleading (kcalEatenPerDay, kcalNetPerDay), because renames were not allowed.
- The detailChrome "macros" snapshot was updated once, on purpose: the meal line is now one string, with the same visible text.
- To satisfy the parity test, addMenu.voice and addMenu.describeOutLoud were added to en and fr (they are unused), and {{count}} was added to es and fr lastSessions_one.

Open for Isa
- es and fr wording: the feminine endings in kJ mode, the "80 %" spacing, lastSessions_one, scanCards.noBreakdown and the range separator.

Gotchas
- zsh does not split $VAR. Run one jest file per command with --ci and never -u.
- Rendering tests must be named *.render.test.tsx.
- Locale files are written with json.dumps(indent=2, ensure_ascii=False) plus a newline, after a byte-identical round trip check.
- The last two rounds asked for work that was already done. Grep before editing.

Not fixed
- signed is defined three times: in ConfidenceBadge.tsx, week.tsx and energy.tsx.
- The badge's hide button reuses gymSession.hide.
- The screen reader label at nutrition.tsx:231 builds "slot, energy" in code.
- formatNumber and the units.ts group helper are hardcoded to en-AU.
- The nutrition scale reads "418g", with no space before the unit.
- Weekday and month names are unchecked on Hermes.

Recommended next: wire localeParity.test.ts into npm run verify (Row 29).