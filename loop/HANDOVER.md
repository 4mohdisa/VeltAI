HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (all BUILT, not verified)
- src/components/food/SavedMealsList.tsx, lastLoggedLabel: counts local calendar days through Date.UTC, not elapsed 24-hour periods.
- src/app/dashboard/plan.tsx:120: uses t('plan.whyThisPlan').
- plan.whyThisPlan added after addTitle in en.json ("Why this plan"), es.json ("Por qué este plan"), fr.json ("Pourquoi ce plan").

GAP ROWS: none built or edited; this was locale and bug-fix work.

IN PROGRESS: nothing mid-edit. The "Macros" task made no edits. Its brief named src/app/nutrition.tsx, which doesn't exist, and no en.json key has the exact value "Macros".

RECOMMENDED NEXT: with a brief allowing locale edits, add a key such as nutrition.macrosKicker to all three locales and use it at src/app/dashboard/nutrition.tsx:77 (kicker="Macros"; t is at line 53). Then run src/__tests__/render/detailChrome.render.test.tsx, which renders this screen and may assert on or snapshot the kicker (not checked).

LAST CHECKS
- Last full run, after the fr key: tsc exit 0; 65 suites, 824 tests, 4 snapshots passing. tsc exit 0 again in the Macros round; nothing edited since.
- Keys: en 150, fr 150 matching; es 152 (extras addMenu.voice, addMenu.describeOutLoud).

DECISIONS
- goals.macros not reused: "Macro targets" would change the English kicker.
- Future-dated logs still read "Last logged today", per brief.
- No "a petit-dejeuner" value exists in fr.json, so nothing was changed. The likely source is "Ajouter à {{slot}}" plus a meal name; a real fix needs per-meal strings in all locales. Waiting on Isa to say where the wording appears.

GOTCHAS
- src/lib/i18n/index.ts:41 fixes lng to 'en' (handover, not rechecked); fallbackLng is 'en'. es and fr never show.
- Handover paths can be wrong: nutrition.tsx is under src/app/dashboard/.
- No test imports plan.tsx. I never checked whether a suite renders SavedMealsList; no test I know of checks the 11pm case.
- design/Lume App.html is gzip-compressed inside its __bundler/manifest; decode assets before searching. The earlier "breakfast" search ran on raw HTML and needs re-running.
- Edit tool can write a plain space for U+00A0. Shell is zsh: quote parenthesised paths; grep with LC_ALL=C /usr/bin/grep.

NOT FIXED
- Hardcoded: dashboard/nutrition.tsx:77 and :79; (tabs)/gym.tsx:112, :121; gym/freeze.tsx:48; StreakCounter.tsx:15.
- lastLoggedDaysAgo_one unreachable in en, es, fr.
- plan.addTitle: es and fr mean "Add to" but en is "Add"; entry.title stays English.
- es extras unremoved; need a confirmed no-use search.

WAITING ON ISA
- Device runs: saved meal labels, including a meal logged late the previous evening; Why this plan heading on a plan with a reason.
- Native review of new es and fr strings.
- Macros key decision.