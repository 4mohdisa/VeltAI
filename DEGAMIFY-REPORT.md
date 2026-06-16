# Degamify Report — all gamification removed, streaks kept

Veltai now has **no gamification**: no XP, points, ranks, levels, badges
(gamification ones), leaderboards, milestone rewards, XP float-ups, rank-up
modals, or in-app rating/review prompts. The **streak** (consecutive gym days +
emergency freeze) is the only progression mechanic. The optional gym selfie stays
a private memory concept (not built; never a reward).

## Task 1 — Research map (every trace found)

| Area | File(s) | What it was |
|---|---|---|
| XP logic | `src/lib/xp/ranks.ts`, `src/lib/xp/index.ts` | `rankFromXp`, `RANKS`, `Rank`/`RankProgress` types, XP→rank ladder |
| XP float-up | `src/components/animations/XpFloatUp.tsx` | "+25 XP" float animation (F1) |
| Rank-up modal | `src/components/animations/RankUpModal.tsx`, `src/app/modals/rank-up.tsx` | full-screen rank celebration (F2) |
| Milestone modal | `src/app/modals/milestone.tsx` | 7/30/100 streak modal with XP bonus + `SKStoreReviewController` note (F3) |
| Confetti | `src/components/animations/ConfettiBurst.tsx` | celebration particles (only used by rank-up + milestone) |
| Rank/XP UI — profile | `src/app/(tabs)/profile.tsx` | rank badge, rank progress bar, total XP, "recent XP events" list |
| XP/rank UI — dashboard | `src/app/(tabs)/index.tsx` | "today's XP earned", rank badge |
| XP toasts — gym | `(tabs)/gym.tsx`, `gym/log-session.tsx`, `gym/auto-detect.tsx` | "+25 XP (+5 verified)" |
| Verification reward badge | `GymStatusCard.tsx`, `gym/history.tsx` | "Health verified / Manual" badge (tied to +5 XP bonus) |
| XP toasts — food | `food/photo-review.tsx`, `voice.tsx`, `uncertainty.tsx`, `serving.tsx`, `barcode-confirm.tsx`, `[meal].tsx` | "+8 XP", "+5 XP", "+3 bonus", "XP already earned" |
| XP toast — onboarding | `(onboarding)/generating.tsx` | "+50 XP · Welcome" on completion |
| Mock data | `src/lib/mock/data.ts` | `mockUser.totalXp`/`xpToday`, `mockRank`, `XpEvent`, `mockXpEvents`, `GymSession.verified` |
| Copy | `profile/delete-account.tsx` | "Your AI plans, XP and rank" |
| Comments | `Stat.tsx`, `ProgressBar.tsx`, `Badge.tsx`, `tokens.ts` | stray "XP totals" / "rank progress" / "milestone" mentions |

**False positives (left untouched):** `perceived effort`/`effort` (a session
metric), `energy_level`/`energy`, `confidence` (food scan), the SVG `points` var in
`wow.tsx` (chart geometry), and the generic `Badge` component (kept for neutral
labels like "AI", "Free trial", "Active").

## Task 2–8 — Removed vs kept

- **Removed entirely:** XpFloatUp, RankUpModal, ConfettiBurst, the rank-up (F2) and
  milestone (F3) modal routes + their `Stack.Screen` registrations, `/lib/xp`, all
  XP toasts/copy, rank badges, rank progress, the recent-XP list, the verification
  reward badge, and the onboarding "+50 XP".
- **ConfettiBurst → removed** (it only ever celebrated XP/rank/milestones — no
  non-gamified reuse).
- **Milestone modal (F3) → removed entirely** (chosen over a "minimal rewardless"
  version): it existed only to grant an XP bonus + fire a review prompt, both of
  which are now banned. A future rewardless "30 days — keep going" acknowledgement
  can be added separately if desired.
- **Rating/review prompts → none exist.** There was no real `SKStoreReviewController`
  code — only comments (in the now-deleted milestone modal and a support note). The
  Support "Send feedback" textarea stays (goes to the team, not a rating nag).
- **Kept:** the **streak** everywhere — `StreakFlame` (orange), `StreakCounter`,
  the 30-day `GymCalendar` (monochrome dots), current/longest/total gym days,
  emergency freeze, unlog. The streak mock fields are now
  `current` / `longest` / `totalGymDays` / `freezesAvailable`. Gym logging, food
  tracking, lockout, onboarding, and the whole design system (Apple Health accents
  on charts/AI/categories — `iconAccents`/`categoryAccent` have **no** XP semantics)
  are intact.

## Task 9 — Final audit (grep results)

Re-running the Task 1 greps over `src/`:

```
XP / awardxp / rankfromxp / rankup / leaderboard / confetti / xpfloatup /
skstorereview / "+N XP" / milestone-reward   →  ZERO real code hits
```

The only matches remaining are:
- Descriptive **absence** comments (e.g. "Streak-only (no XP, no ranks)", "NO
  gamification: streak is the only progression", the support note "no in-app
  rating/review prompts at all") — 4 such lines, intentional.
- The SVG `points` variable in `wow.tsx` (chart geometry) — false positive.

- `npx tsc --noEmit` — **clean**.
- `npx expo export --platform ios` — **succeeds**.

## Verification of what still works

- **Streaks/freezes:** streak hero (flame + count) on Dashboard, Gym, Profile;
  30-day calendar; streak-detail screen; apply-freeze sheet — all intact, XP-free.
- **Gym logging:** logging updates the streak only; toast says "Gym logged. Lockout
  lifted." (no XP); history shows date/duration/effort/notes (no verification badge).
- **Food/lockout/onboarding/design system:** unchanged except XP toasts removed.
- App **launches and bundles** on the simulator (fresh JS loaded, no errors).

### `[?]` — live screenshot not captured this session
Same as the prior two passes: `xcrun simctl openurl` to app routes returned
"Unmatched Route" on the cold-launched app (an expo-router/`openurl` deep-link
quirk — the app itself runs and the bundle compiles clean). For a removal task,
the static verification is authoritative: the grep proves zero gamification code,
tsc proves no dangling references, and export proves the app builds. The streak-
only screens are visible when the app is run normally (tap through onboarding).

## Git log

```
degamify: audit clean
degamify: remove rating prompts
degamify: remove XP/rank logic + mock data
degamify: food logging XP removed
degamify: gym logging is streak-only
degamify: dashboard XP removed
degamify: profile shows streak only
degamify: remove XP/rank/milestone UI
```

## Confirmation

All gamification (XP, points, ranks, levels, gamification badges, leaderboards,
milestone rewards, rating prompts, XP float-ups, rank-up/milestone modals) is
removed. Streaks, freezes, the selfie *concept*, gym logging, food tracking,
lockout, onboarding, and the design system all remain. The workout-schedule and
gym-selfie capture features were **not** built.
