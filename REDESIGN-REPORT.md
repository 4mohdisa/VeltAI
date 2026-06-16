# Redesign Report — Veltai monochrome pass

**Status:** complete
**Phases done:** R0–R6

A visual-only reskin to pure monochrome (Cal AI-clean). No logic, routing, data
shapes, screen structure, or component props were changed — only styles, the icon
system, the tab bar, and sheet presentation. tsc is clean and the app builds,
runs on the iOS simulator, and exports for iOS.

## What changed

- **Tokens (R0):** Rewrote `src/lib/design/tokens.ts` to a closed monochrome
  palette (black / white / grey 50–900, incl. gray150/600/800). Deleted the
  accent, semantic (warn/error) and streakFire colours. Added `surface` (fills),
  `sheet` tokens, heavier type with the `statHero/statLarge/statMedium/statSmall`
  scale + `bodyMedium`/`label`, generous spacing (xl=20, 2xl=28 … 5xl=64), pill
  radii (sm=10 … xl=28, pill=999), softer shadows. A temporary compat-alias block
  let the app stay green through R1–R5; it was **deleted in R6**.
- **Icons (R1):** New `Icon` primitive wrapping `expo-symbols` `SymbolView` with
  an Ionicons→SF Symbol map. Migrated all 43 icon-using files (+ StreakFlame by
  hand). Every glyph is now a native SF Symbol, monochrome.
- **Tabs (R2):** `(tabs)/_layout` → `expo-router` `NativeTabs` (native UITabBar,
  light `systemChromeMaterial`, black active / grey inactive, SF Symbol icons).
  Removed the custom JS tab bar.
- **Components reskinned (R3):** Card (grey fill, no border, 20px radius, 20px
  padding), Button (monochrome pills — black primary / outline secondary &
  destructive, 52pt), TextField (filled, border only on focus), MultiSelect chips
  (pill, black when selected), SegmentedField (black selected segment), Badge
  (monochrome pill), DailyMacroRing (black arc on grey track), MacroBars (black on
  grey), Lockout/Nudge banners (grey fill, no border), Toasts (solid black),
  StreakFlame/StreakCounter/XpFloatUp (black), ConfettiBurst (greyscale),
  GymSessionButton & UncertaintyPrompt options (pill fills), BackButton (grey
  circle).
- **Sheets (R4):** log-session, freeze, add-meal, uncertainty, confirm now
  present as native `formSheet` (detents, grabber, 28px corners). Content
  unchanged.
- **Screens polished (R5):** Migrated every accent/warn/error/streakFire alias to
  explicit monochrome tokens (0 remaining). Generous spacing applied via the
  `Screen` scaffold + the four tab screens. One-black-button fixes (permissions
  "Allow" → outline, gym auto-detect "Yes" → outline).
- **Audit (R6):** Zero hex/rgba outside tokens.ts, zero `accent`/`color.warn`/
  `color.error`/`streakFire`/green/orange references, zero Ionicons/vector-icons
  imports. Removed the temp alias block. Removed unused deps
  `@react-navigation/bottom-tabs` and `@expo/vector-icons`. Dropped the dead
  `tone`/`BadgeTone` prop. tsc clean; `expo export --platform ios` succeeds.

## What to check first

- **Walk onboarding A1→A19** — exercises every component in the new skin.
- **Dashboard** — confirmed in-sim: grey-fill cards, one black "Log gym session"
  pill, black macro ring, native tab bar with SF Symbols (verified by screenshot).
- **Gym calendar** — monochrome dots, black `flame.fill`.
- **Confirm zero colour** outside tokens.ts (audit is clean).

## Notes / deferred

- **SegmentedField** was reskinned to a monochrome custom control (grey track,
  black selected segment) rather than migrated to the `@expo/ui` SwiftUI Picker.
  This was a deliberate reliability call for the autonomous pass — the native
  Picker integration is fiddlier and the monochrome custom control matches the
  look. Swapping to `@expo/ui` Host+Picker is a clean follow-up.
- **Time inputs (A11)** remain 15-minute Steppers (no `@react-native-community/
  datetimepicker` added) — unchanged from the original build, out of scope here.
- **`toast.tone`** still accepts `'warn'`/`'error'` as *behavioural* values, but
  ToastHost renders every toast as a solid black surface (monochrome). The tone
  only selects the SF Symbol.
- A few **legitimate borders** remain (focused TextField, outline Buttons, the
  GymCalendar day-state dots, the Avatar ring, photo-placeholder tiles) — these
  are intentional per the design ("borders are a last resort", not banned).
- The **gym selfie feature was not built** (explicitly out of scope).
- Native changes (SF Symbols, NativeTabs) required one `expo run:ios` rebuild;
  all R3–R6 style changes hot-reload on top of it.

## Git log (redesign)

```
redesign R6: audit clean        (this commit)
097a31c redesign R5: screen polish + monochrome migration
b6674e6 redesign R4: native sheets
3bb399d redesign R3: core components
de6821b redesign R2: native tabs
e0fd956 redesign R1: SF Symbols
2a5738d redesign R0: monochrome tokens
```

## Verify

```bash
npx tsc --noEmit
npx expo run:ios   # rebuild once for native tabs + SF Symbols, then it hot-reloads
```
