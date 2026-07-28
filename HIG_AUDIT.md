# Lumo — HIG Audit (Phase 14, 2026-07-28)

Every screen in `src/app/` (63 route files) plus every shared component was
audited against Apple's current HIG (fetched live this phase: layout,
typography, accessibility, buttons, feedback, playing-haptics) by ten parallel
auditors — five walking screen groups, five sweeping cross-cutting concerns
(design tokens/contrast, Dynamic Type, motion+haptics, VoiceOver labels,
keyboard/forms). Findings below are grouped by fix location. **Fixed** means
fixed and verified this phase (tsc + eslint + 317 jest tests green).

## What was already right (verified, not re-litigated)

- **Reduce Motion is honoured app-wide**: root stack falls back to fade,
  BottomSheet snaps, toasts fade, every Lottie-less animation branches on
  `useReduceMotion`; **no spring physics anywhere** (timing curves only).
  The one gap (camera modals hard-coding `slide_from_bottom`) is fixed.
- **Dynamic Type**: `allowFontScaling` is never disabled, no
  `maxFontSizeMultiplier` caps exist, `lineHeight` scales with the font scale,
  crowded rows stack at large text via `useLargeText`.
- **Haptics** follow the system-pattern mapping consistently (selection on
  segment taps, success/error paired with toasts, warning around destructive
  confirms) — one gap (dietary multi-select chips silent) noted low, deferred.
- **Safe areas** correct everywhere (Screen/OnbScaffold/SheetContent);
  home-indicator clearance handled; back-swipe enabled on every pushed screen
  (zero `gestureEnabled:false`); camera modals all have labelled Close buttons.
- Async buttons show loading and block double-submit (shared Button); every
  destructive flow confirms; `gym/session` guards unsaved progress on leave.
- Core contrast: primary text and `#6B6B6B` secondary text are AA on all
  surfaces (deliberately darkened in the token pass).

## Fixed — shared components (one change, every consumer inherits it)

| Component | Defect | Fix |
|---|---|---|
| Screen.tsx | No keyboard avoidance anywhere; sticky footer CTA hidden by the keyboard on every form screen | KeyboardAvoidingView(padding) around body+footer, `keyboardDismissMode="interactive"` |
| OnbScaffold.tsx | Same, for all onboarding forms | Same fix; back circle also got hitSlop → 44pt |
| SheetContent.tsx | Same, for sheet flows (log-session Notes) | Same fix |
| BottomSheet.tsx | Bottom-anchored sheets hosting TextFields were covered by the keyboard (edit sheets, rename autoFocus) | KeyboardAvoidingView wrapper — all five consumers inherit |
| TextField.tsx | Fixed 52pt height clips scaled text at AX sizes | `minHeight` |
| NavBar.tsx | Fixed 52pt height clips scaled titles | `minHeight` |
| Icon.tsx | **9 icon names unmapped → rendered blank**: send (Ask-Lumo send button was an empty circle), chevron-up/down, refresh-outline, link-outline, log-out-outline, pulse-outline, bulb, cloud-offline-outline | SF map entries added |
| ToastHost.tsx | Action label (~24pt) below the 28pt floor on a transient surface | hitSlop 12 |
| SliderField.tsx | 28pt drag area at the absolute floor | 44pt gesture container, visuals unchanged |
| SettingsList.tsx | `destructive ? black : black` dead ternary — destructive rows identical to normal | Destructive rows/icons render in `accent.red` |
| Button.tsx | `destructive` variant pixel-identical to `secondary` | Destructive label renders in `accent.red` |

## Fixed — functional bugs found by the HIG walk (silent data loss / fake UI)

These went beyond styling — the audit found interactions that lied:

- **barcode-confirm "Done" never logged the product** (toast + navigate only) → now logs via the data seam.
- **serving-picker "Done" never logged the food** ("Mocked save" per its own header) → now logs.
- **Food tab pull-to-refresh was a 700ms fake spinner** → now calls `refetch()`.
- **Onboarding targets sheet silently discarded protein/carbs/fat edits** → the sheet now edits only the calorie target (the macro fields were never persisted; honest removal).
- **log-session discarded the "Energy level" input** → retained on the session (store test added). Effort/energy still aren't in the backend session schema — documented, device-local.
- **"Gym logged — streak extended." fired even when nothing was logged** (already logged today) → honest "Already logged today."
- **gym/schedule failure toast claimed "Saved on device" while saving nothing** → rolls back + honest error copy.
- **Freeze flow implied three different days** (row label vs "tomorrow" copy vs store writing today) → day label/offset flow end-to-end (store test added).
- **Dashboard GymStatusCard hardcoded a "62 min" session duration** → real duration or omitted.
- **Scan overlay showed fabricated "Lighting 3/5" and pulsing "Steady" sensor readouts** (no sensor access exists) → deleted; honest guidance kept.
- **food/history rows navigated to today regardless of the day tapped** (and the data is a mock) → rows are now non-navigating plain rows.
- **notifications screen persisted nothing** (all toggles lost on unmount) → persisted in the settings store.
- **barcode-scan "Simulate scan"/"Unknown code" dev buttons shipped in release** → gated behind `isDevBuild()`.
- **preview screen hardcoded "$8.99/month"** (would go stale/wrong per storefront) → softened.
- plan.tsx hardcoded kcal ignoring the unit preference → `formatEnergy`.

## Fixed — inputs & forms

- signup: `textContentType` email/oneTimeCode + autoComplete (OTP autofill now works), returnKeyType submit wiring, inline field errors instead of vanishing toasts.
- measurements: accessibility labels on the unlabeled height/weight fields, decimal-pad, inline range validation (age 13–100, height 100–250cm, weight 30–300kg) — typos no longer silently become population defaults.
- decimal-pad standardised for weights/macros (custom-food, FoodItemEditSheet, session weight/distance, measurements).
- goals + (misc fields): draft-per-field editing committed on blur — no more snap-to-"0" while typing; calories helper notes the 1,200–10,000 band.
- new-template: Name→Duration focus advance; FoodItemEditSheet delete now confirms like every sibling destructive path.
- quick-add: 0-kcal entries blocked; disabled CTA copy honest.

## Fixed — accessibility & tap targets

- Nested-Text links replaced with role-carrying Pressables at ≥44pt: signup Terms/Privacy + mode toggle, paywall Restore/Terms/Privacy (VoiceOver could not reach any of them before).
- Nested-pressable banners (AiNudgeBanner, AnomalyBanner) restructured so VoiceOver can reach the dismiss X.
- ProgressDots: progressbar role + "Step X of Y"; unfilled dots darkened to meet 3:1.
- ai-query: question field labelled; send icon now renders; chips hitSlop.
- Tap targets raised to ≥44pt effective (or ≥floor with hitSlop) on: onboarding back, scan chips (½×/1×/2×, angle picks), photo thumbnails' remove, capture-tip "Got it", saved-foods "+", session checkbox, templates "+", chart bars, more/less + Read more links, "How is this calculated?", "Why?".
- Contrast: all ~14 sites using `tertiaryLabel`/gray400 (#8A8A8A, ~3.4:1) for meaningful sub-18pt text switched to `secondaryLabel` (#6B6B6B, AA); ConfidenceBadge point values no longer green/yellow at 13pt.
- energy screen: per-bar "In/Out" text labels + per-row VoiceOver summaries — no longer colour-only (the orange/green pair is CVD-confusable).
- exercise-progress: tooltip minHeight, every-other-bar date labels (no truncation).
- delete-account: back now steps backward through the flow instead of popping it.
- photo-capture: permanent camera denial now offers "Open Settings" (was a dead button); caption/button legibility over the live camera fixed with scrims.
- LegalScreen backLabel no longer lies about where back goes.

## Accepted deviations (deliberate, documented)

- **TextField placeholders stay #8A8A8A** — matches the iOS system placeholder
  convention; placeholders are hints, not content (labels carry the meaning).
- **Monochrome-first palette** stays; destructive actions now carry
  `accent.red` as the one functional-colour exception (HIG red-for-destructive).
- **about/support version strings are hardcoded "1.0.0"/build 1** — accurate
  for this submission; reading them from expo-application would add a
  dependency. Revisit at the first version bump.
- **SegmentedField "Prefer not to say"** may shrink-then-truncate at extreme AX
  sizes — cosmetic at ≤AX3, standard wording kept.
- **"Send to Apple Health" / voice screens** are gone entirely (see
  DECISIONS.md — they were fake features, removed in Phase B).
- i18n: three add-menu cards use literal English strings (pre-existing;
  the app ships English-only for v1).

## Deferred (with reason)

- effort/energy fields on the backend gym-session schema (needs a migration +
  API change; values are retained device-local; low user impact).
- Slot targeting for scan flows (photo/label/barcode resolve their slot
  internally in the scan seam; Quick Add + Saved foods consume the slot param).
- Dietary multi-select chip haptics (low; the control is otherwise correct).
- clerkMessage (server-side) auth errors remain toasts; local validation is
  inline (scoped decision).
