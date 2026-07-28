# Lumo — Phase 14: Final Audit & Submission Readiness

**This is an audit and polish pass, not a feature build.** Everything is written.
The job now is to prove it is correct, compliant, native-feeling, and complete —
and to fix what isn't.

Run with Fable 5, autonomously, in a **fresh Claude Code session** (no prior
context — the prompt is self-contained).

---

## Why a fresh session

Prior sessions carry ~14 phases of accumulated context. That's now a liability:
stale assumptions get carried forward as fact. This pass must **re-derive
everything from the code**, not from memory of what was reported.

Standing rule for the whole phase: **verify in the code, never trust a claim in
a document.** Prior reports may be wrong. The repo is the truth.

---

## Phase A — Research (do this first, do it properly)

Three sources, in order of authority:

**A1. Apple's current published guidance.** Fetch and read, don't recall:
- App Review Guidelines (developer.apple.com/app-store/review/guidelines)
- App Store Connect / App Privacy details ("nutrition labels")
- HealthKit requirements and restrictions
- Human Interface Guidelines — iOS: layout, typography, controls, navigation,
  feedback, accessibility, dark mode posture
- Auto-renewable subscription requirements
- Account deletion requirement (5.1.1(v))

These change. My knowledge has a cutoff. **Fetch the live versions.**

**A2. The user's own Notion Apple-guidelines document.** Search the connected
Notion workspace for the Apple/App Store guidelines page and read it in full.
It may contain project-specific decisions and prior findings. If Notion isn't
reachable, say so plainly in the report rather than silently skipping it.

**A3. The repo itself.** APP_STORE_CHECKLIST.md, SECURITY_AUDIT.md, DECISIONS.md,
CONFIG.md, PRODUCTION_READINESS.md. Read them as *claims to verify*, not facts.

Output: `RESEARCH_FINDINGS.md` — what the current rules actually require, what
changed vs. what the repo assumes, and every gap this creates.

---

## Phase B — Apple compliance audit

Verify each against the code, mark PASS / FAIL / BLOCKED, fix every FAIL.

**Account management (critical — no web version exists, so all of it must be
in-app):**
- Account deletion reachable in-app, ≤2 taps from Settings
- Deletion is genuinely destructive (FK cascade), not a soft flag
- Confirmation is unambiguous and the copy states it's permanent
- Sign out works and clears every store, the offline queue, and RevenueCat identity
- Profile/account management: view and edit what's editable, see subscription
  status, restore purchases, contact support
- **Data export.** Verify whether Apple/GDPR posture requires it. If the app
  collects health data and offers no web portal, an in-app export is the
  defensible position. If it's missing, build it — a simple JSON export of the
  user's own data via an authed endpoint.

**Privacy:**
- Privacy Policy and Terms reachable in-app without an account (before sign-in,
  from the paywall, and from Settings)
- Every third party disclosed: Clerk, Supabase, Gemini, Anthropic, RevenueCat,
  Strava, WHOOP, Apple Health
- The app's own promise — "no advertising or tracking SDKs" — is still literally
  true after the first-party analytics work. Verify. If any third-party SDK
  collects behavioural data, either remove it or correct the promise.
- App Privacy nutrition-label answers drafted: what's collected, what's linked to
  identity, what's used for tracking (should be: nothing)
- HealthKit data is never used for advertising, never shared, never written falsely

**Subscriptions (3.1.2):**
- Before purchase, the paywall shows: plan name, duration, exact price per
  period, what happens after the trial, auto-renew terms, and working Terms +
  Privacy links
- Restore Purchases exists and works
- No entitlement is silently granted in a release build

**Health (1.4.1):**
- "Not medical advice" disclaimer present at every point targets are derived or
  displayed
- No dangerous guidance: verify calorie targets can't be set to unsafe values,
  and that the app doesn't encourage extreme deficits

**Completeness (2.1):**
- Demo account seeded with realistic data, credentials ready for review notes
- No placeholder text, no dead buttons, no feature that errors on first use
- Every permission string is specific and every permission is actually used

---

## Phase C — Native iOS feel (the HIG pass)

This is the "does it feel like an Apple app" phase. Audit every screen against
the HIG and fix what's off.

**Layout & spacing:**
- Consistent margins against a single spacing scale — no one-off magic numbers
- Safe-area handling correct on notched devices, both orientations if supported
- Tap targets ≥44×44pt everywhere (audit every button, row, icon, chip)
- Consistent vertical rhythm between sections; no accidental double-padding
- Lists: correct inset-grouped styling, separator insets aligned to content

**Typography:**
- One type scale, applied consistently — audit for stray font sizes
- Dynamic Type support: text scales with the user's system setting without
  clipping or overlap. Test at the largest accessibility sizes.
- No text truncation that loses meaning

**Controls & inputs:**
- Every input: correct keyboard type (numeric for weights, email for email,
  decimal pad where decimals are valid)
- `returnKeyType` and focus advance behave sensibly across multi-field forms
- Keyboard avoidance: no input ever hidden behind the keyboard
- Inputs dismiss the keyboard on tap-outside and on scroll where appropriate
- Validation errors appear inline, near the field, in plain language
- Disabled states are visually distinct and non-interactive
- Loading states on every async button; double-submit is impossible

**Navigation & feedback:**
- Interactive back-swipe works on every pushed screen
- Modals dismiss by swipe, by button, and by backdrop where appropriate
- No screen can trap the user with no way back
- Haptics: selection on tap, success on save, error on failure — consistent
- Every mutation gives feedback (toast or state change); no silent success

**Motion & accessibility:**
- Reduce Motion respected everywhere
- VoiceOver: every interactive element labelled; reading order sensible
- Contrast meets WCAG AA against the app's palette
- No information conveyed by colour alone

Output: `HIG_AUDIT.md` — every screen, every finding, severity, fixed or deferred.

---

## Phase D — Monorepo integrity

- `/app`, `/backend`, `/web` each build and test independently
- No cross-package imports that break independent deployment
- Backend is fully env-driven — no hardcoded hosts, no code edit needed to deploy
- Every package's README is accurate (commands actually work as written)
- `.gitignore` correct: no secrets, no build artifacts, tests still tracked
- All migrations present and sequential; the applied-vs-unapplied state is
  documented honestly
- One command per package to run its tests, documented

---

## Phase E — Feature completeness & energy cross-check

**Verify every feature works end to end in code**, not that it exists:

Food: manual log, search, barcode, label scan, photo scan (single + multi-angle),
quick add, saved meals, recipes, corrections, portion memory.

Gym: exercise library, templates, weekly schedule, today's workout, check-in with
tick-off, parameter capture (treadmill speed/incline etc.), ACSM calorie math,
progress tracking, streaks, muscle chart.

**Energy balance — the cross-check the user specifically wants verified:**
- Calories in (food logs) vs calories out (BMR + exercise) → net balance
- Exercise calories come from three sources and must reconcile without
  double-counting: ACSM parameter-based, flat MET fallback, and **device imports
  (Apple Health / Strava / WHOOP)**
- **Critical: verify a workout imported from Strava/WHOOP/Apple Health cannot
  also be logged manually and counted twice.** Dedupe keys exist
  (`strava_activity_id`, `whoop_workout_id`, `apple_health_uuid`) — prove they
  work, including the case where the same session arrives from two providers.
- Verify the daily/weekly energy endpoints return correct arithmetic against
  hand-computed fixtures
- Verify Apple Health *write-back* (dietary energy) doesn't create a feedback
  loop where Lumo reads back its own written data as new intake

AI brain: insights, morning brief, query, learning signals, per-user context.

Integrations: OAuth flows, token encryption, sync, dedupe, disconnect.

Auth & billing: every state in the auth machine, entitlement gating, restore.

---

## Phase F — Fix, test, verify

- Fix every FAIL from B, C, D, E
- Add a regression test for each fix
- Full suite green: backend build/vet/test/race, frontend tsc/eslint/test
- Coverage reported honestly (no assertion-free padding)
- Nothing existing broken

---

## Phase G — Report

`PHASE_14_REPORT.md`:
- Research findings and what changed vs. the repo's assumptions
- Compliance table: every Apple requirement, PASS/FAIL/BLOCKED, evidence
- HIG audit summary and what was fixed
- Energy cross-check proof, including the double-count scenarios tested
- What is still genuinely blocked and precisely what unblocks it
- Ordered list of remaining human actions
- Honest assessment: submit-ready or not, and what would fail review

---

## Known blockers going in (not the agent's to solve)

1. Backend not deployed — app can't function on a device until it is
2. Apple Developer account still in compliance screening
3. Clerk + RevenueCat keys not set
4. Three migrations unapplied to production
5. HealthKit needs a native module + entitlement + native rebuild
6. Strava/WHOOP need registered apps and credentials