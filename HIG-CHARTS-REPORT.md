# iOS HIG Series · Prompt 6/6 — Charts (FINAL) Report

The final pass: every chart HIG-compliant + accessible — headlines, plain-language
takeaways, labeled values, non-colour encoding, VoiceOver summaries, empty/loading
states. Frontend-only, mock data, tsc green before every commit.

**Standing constraints upheld:** (1) **Monochrome chrome** — functional accent is
used *within* charts but never the only cue (labels/markers always present). (2)
**Light theme only**. (3) **Custom Liquid-Glass nav chrome kept.**

---

## Task 1 — Chart inventory

| Chart | Type | Screen(s) | Encodes | Before this pass |
|---|---|---|---|---|
| **DailyMacroRing** | Ring | Dashboard, Nutrition | calories consumed vs target | number+label inside, energy-unit aware; no headline/takeaway, no VO summary |
| **MacroBars** | Bars | Dashboard, Nutrition | protein/carbs/fat/fibre vs target | per-row label + distinct icon shape + colour (non-colour ✓); no headline/takeaway/VO summary |
| **CalorieCrossCheck** | Columns | Nutrition | eaten vs active-burn vs goal | headline + takeaway present; "kcal" hardcoded (ignored energy unit); active-burn has flame+label (non-colour ✓) |
| **GymCalendar** | Calendar/heatmap | Gym tab, Streak detail | per-day session/freeze/missed/today | shape/symbol-encoded + legend + per-cell VO labels (A11y pass ✓); no takeaway summary |
| **CalorieCrossCheck** net line | Text insight | Nutrition | net vs goal | present |
| _Weight projection_ (`wow.tsx`) | Line | Onboarding | 90-day projection | OUT OF SCOPE — onboarding content (not touched); already direct-labelled + green data colour |
| StreakFlame / StreakCounter / GymStatusCard | Stat/hero (not charts) | — | streak number / gym status | n/a |

Non-onboarding charts in scope: **DailyMacroRing, MacroBars, CalorieCrossCheck,
GymCalendar.** What each received is detailed in Tasks 2–5 below.

<!-- TASKS-2-6-PLACEHOLDER -->
