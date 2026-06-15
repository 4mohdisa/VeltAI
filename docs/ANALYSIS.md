# Veltai — Doc Analysis (Phase 0)

**Run:** 2026-06-16 (overnight autonomous build)

## What the app does (one sentence)

Veltai is an iOS-only, AI-powered health performance app whose single focus is getting the user to the gym — using app lockout (Family Controls) until the daily session is logged, honest photo/voice food tracking with uncertainty prompts, and AI-generated personalised daily plans, on a 14-day trial then A$9.99/month (RevenueCat + StoreKit).

## Key facts pulled from the docs

- **Accent colour:** Veltai Green `#16A34A` (from `Theme & Design Tokens.md`). This is authoritative. `UI & Design System.md` mentions a "tentative `#15803D`" and "finalise during design phase" — resolved in favour of the more specific tokens doc: `#16A34A` is `accent`, `#15803D` is `accentDark`/`accentText`.
- **Design law:** Black-on-white, one accent only, no gradients/glassmorphism/skeuomorphism, no emoji UI, no dark mode (Phase 2). 8pt spacing grid. iOS system font (SF Pro). All visual values live in `/lib/design/tokens.ts` — nothing hardcoded elsewhere.
- **Screen count:** 19 onboarding (A1-A19) + 4 Dashboard (B1-B4) + 12 Food (C1-C12) + 6 Gym (D1-D6) + 12 Profile (E1-E12) + 9 shared modals (F1-F9) = **~62 distinct states**, ~30 core unique screens.
- **Navigation:** First launch → 19-screen onboarding (one-time) → four-tab main app (Dashboard, Food, Gym, Profile). Modals/overlays appear over any tab.
- **Tech stack (mobile):** Expo SDK 54, New Architecture + Hermes, Expo Router (file-based), iOS-only. Reanimated 3 (UI-thread animations), FlashList, React Query, Zustand, expo-camera, expo-haptics, expo-secure-store, react-native-svg, expo-blur. Backend (Go/Fiber + Supabase) and AI (Gemini 3.5 Flash) are OUT OF SCOPE tonight — mock all data.

## Build order

**From `MVP-scope.md` (full 10-week plan):** backend → mobile skeleton + onboarding → gym → food → lockout → AI plans + polish → submission.

**From `App Screens.md` (frontend-only, the order this build follows):**
1. Tab shell + Dashboard B1
2. Profile E1-E12 (static, good warm-up)
3. Gym D1-D6 (streak/log loop)
4. Food C1, C2, C9-C12 (manual, no AI)
5. Food C3-C8 (photo/voice/barcode, mock AI)
6. Onboarding A1-A19 (last — component library mature by then)
7. Modals F1-F9 (sprinkled throughout)

The `TASKS.md` phase order follows this: Phase 2-4 build the component library first, then Dashboard → Profile → Gym → Food(manual) → Food(AI) → Onboarding → Modals/Polish.

## Conflicts found in the docs (and resolutions)

1. **Accent colour:** `UI & Design System.md` says `#15803D` "tentative, finalise during design phase"; `Theme & Design Tokens.md` says `#16A34A`. → **Resolved to `#16A34A`** (more specific, later, authoritative tokens doc; brief confirms `#16A34A`).
2. **Grayscale palette depth:** `UI & Design System.md` lists a short gray ramp (700/400/200/100) with slightly different hexes (e.g. gray400 `#A0A0A0`); `Theme & Design Tokens.md` lists a full 50-900 ramp (gray400 `#A3A3A3`). → **Resolved to the full tokens-doc ramp.**
3. **Warn/Error hexes:** UI doc says warn `#B45309`, error `#B91C1C`; tokens doc says warn `#F59E0B`, error `#DC2626`. → **Resolved to tokens doc.**
4. **Onboarding screen count framing:** Features/01 describes a "5-phase / ~13 question screen" model; `App Screens.md` enumerates 19 concrete screens A1-A19. → Both consistent; build the 19 concrete screens, apply the 5-phase emotional framing (problems → reflection → data → wow → transparent paywall).

## Key product rules to honour in the UI (from Bugs to Avoid + Gamification)

- Rating prompt only after a 7-day streak, never in onboarding; never incentivised (BUG-001/015).
- Uncertainty prompt flow for any low-confidence food ingredient — the accuracy moat (BUG-009).
- One price shown everywhere, visible Restore Purchases + closable paywall (BUG-004/010/011).
- Account deletion flow required (Guideline 5.1.1(v)) — E12 multi-step.
- XP: gym session 25, photo/voice meal 8, manual meal 5, uncertainty +3, streak milestones 50/200/500. Ranks: Recruit→Contender(500)→Locked In(2k)→Grinder(5k)→Elite(15k)→Untouchable(50k). Streak freezes (max 2). Visual feedback must feel satisfying (XP float-up, rank-up modal, streak flame) — all on UI thread.

## Mock-data conventions for this build

Realistic Australian values; diverse names; cuisines weighted to Pakistani, Australian, Mediterranean (founder context). Example dashboard state: `{ streak: 13, sessionsThisWeek: 3, target: 4, xpToday: 33, rank: 'Locked In', totalXp: 2480 }`.
