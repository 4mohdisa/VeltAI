HANDOVER: branch loop/design-match. Don't switch, push or merge. The loop script commits. Don't open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; nothing has been checked on a device.

ROW STATUS (DESIGN_GAP_ANALYSIS.md)
- Row 83, Log button: still DIFFERENT because of the route. Copy and icon BUILT: gym.logThisSession (en, es, fr), trailing chevron-up.
- Row 112, Gym tab: PARTIAL. BUILT: Log button position and visibility, MyScheduleCard, lumeFade, eyebrow, title block, page gap 14. Re-checked as app-only: Training list, LoadFailedNotice.
- Earlier, unchanged: rows 85 and 87.

IN PROGRESS: nothing. Last check: tsc exit 0; hydrationErrorScreens, oneTapGymLog, tabNavigation passed 24/24. Last full suite 824/824, before the lumeFade, eyebrow, title block and page gap changes.

KEY FILES
- src/app/(tabs)/gym.tsx
- src/components/gym/MyScheduleCard.tsx
- src/components/domain/GymSessionButton.tsx
- src/lib/i18n/locales/en.json, es.json, fr.json
- design/Lume App.html: gym bundle 7dc211f6. Decode into /tmp only.

DECISIONS
- MyScheduleCard shows three days, as the design does; don't change it. It uses useSchedule() only, since each day embeds its template and exercises.
- addMenu.logGymSession stays "Log gym session"; the design's + menu uses that copy.
- Fade runs on mount only, plays once per launch, skipped under Reduce Motion. The easing bezier is literal because motion.easing.enter is a CSS string.
- Eyebrow minHeight 26 sits on a wrapper View, so the text centres as in the design.
- Toast fade is parked.
- Row 81 and other stale doc text wait until no build row is open.

WAITING ON ISA
- Training list: keep or remove. Recommended keep; /gym/templates and /gym/history have no other entry (path grep).
- LoadFailedNotice: accept as a deviation. Recommended keep.
- GymPatternsCard padding: 20 or 16.
- Device checks: fade, shadows during the fade, pull-to-refresh, title block spacing, eyebrow centring, French button label, schedule card weekday labels.

SPOTTED, NOT FIXED
Recommended next: re-check Gym page top and bottom padding against the design's 70 and 158 (app: insets.top + space.md, TAB_BAR_CLEARANCE).
- Stale doc text: row 81 and section near line 586; near line 436 and 446; CTA paragraph near line 532; lines 236 and 310.
- GymSessionButton: logged branch is dead with hardcoded copy; about 56pt tall against 52; label 17/24 against 16/21; duplicates Button styles.
- MyScheduleCard: "N days planned" colour, pressed state; pull-to-refresh doesn't update it; double fetch on first load; disappears silently on failure; weekday follows device language.
- Two LoadFailedNotices can stack (gym.tsx and TodayCard).
- gym.tsx header comment lists the old card order.
- GymStatusCard.tsx:30 hardcodes "Log gym session".
- SettingsList.tsx:129 has identical branches.

GOTCHAS
- Use LC_ALL=C /usr/bin/grep; quote (tabs) paths.
- The three gym suites only read source text; nothing renders these screens.
- Row numbers are file line numbers; grep before citing.
- The `loop/` notes show as modified; not ours.