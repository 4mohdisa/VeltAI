HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (all BUILT, not verified)
- src/lib/i18n/locales/es.json: gymLog group; dashboard.dayStreak_one/_other; gymLog.celebration.streak_one/_other.
- src/lib/i18n/locales/fr.json: dashboard and nutrition groups; settings.scanAccuracy; streak_one/_other. fr.json now has every en.json key.
- src/lib/i18n/locales/en.json: dashboard.dayStreak_one/_other; streak_one/_other.
- src/components/gym/CelebrationCard.tsx: gets the streak label itself via t() with count; streakLabel prop removed.
- src/app/gym/log-session.tsx: streakLabel line removed.
- src/app/(tabs)/index.tsx:126: single t() call with count.

GAP ROWS: none newly built or edited. Row 17 (celebration card) was touched by the streak work, but its text is unchanged and still says "Footnote still missing".

IN PROGRESS: nothing mid-edit. Recommended next: add settings.scanAccuracy to es.json, directly after goals. It is the last key missing from any locale.

LAST CHECKS: tsc exit 0; all three locales parse; 65 suites, 824 tests, 4 snapshots passing.

DECISIONS
- Celebration strings have no {{count}}: the design shows the number and "day streak" as separate lines, so embedding it would print the number twice. Count only selects the plural.
- Dashboard strings do contain {{count}}, per brief.
- English one and other are identical ("day streak"), keeping existing wording. The design's Summary line is hyphenated ("14-day streak"); not changed.
- fr remainingToday is "Il reste {{value}} aujourd’hui", avoiding agreement with an unknown value.
- fr gymBedtime is "Créneau de sport"; es uses "Gimnasio".
- New fr strings use U+2019, and U+00A0 before colons.

GOTCHAS
- src/lib/i18n/index.ts:41 fixes lng to 'en', so es and fr never show on screen.
- No test covers locale files, plural selection or CelebrationCard rendering. A passing suite says nothing about them.
- If a locale keeps a base key while code passes count, i18next is expected to use that base key before falling back to en.
- The Edit tool can write a plain space for U+00A0. Patch with node using escapes and check code points.
- The design HTML is a bundle: decode the manifest in memory with node -e to search its copy.
- Briefs often ban /tmp and output redirection. Shell is zsh: quote parenthesised paths; grep with LC_ALL=C /usr/bin/grep.

NOT FIXED
- Hardcoded: plan.tsx:120 "Why this plan"; nutrition.tsx:77 "Macros"; (tabs)/index.tsx:115 and :121 (reads "1 days"); (tabs)/gym.tsx:112 and :121; gym/freeze.tsx:48; StreakCounter.tsx:15.
- dashboard.welcome and gymBedtime look unused.
- entry.title stays English in plan.addTitle.
- lastLoggedDaysAgo_one is unreachable.
- SLOT_KEYS duplicated in add.tsx and food.tsx.

WAITING ON ISA
- Device runs: celebration card and Summary streak at 1 and above; saved meal cards; plan screen; VoiceOver Add label.
- Native review of all new Spanish and French strings.
- Whether French standardises on U+00A0 and U+2019.