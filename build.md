# Veltai — Build Session

You are implementing the Veltai iOS app following the plan in `./TASKS.md`. This prompt is reusable — run it for every build session. It picks up where the previous session left off.

---

## Read first (every session)

1. `./TASKS.md` — find the first phase with unchecked `[ ]` items
2. The "Session log" section at the bottom of TASKS.md — read the most recent entries so you know what was done before and any notes left for you
3. `./docs/Design/Theme & Design Tokens.md` — color, type, space, radius, shadow values (authoritative)
4. `./docs/Design/UI & Design System.md` — component philosophy
5. `./docs/Design/App Screens.md` — find the layout descriptions for the screens in this phase
6. The matching `./docs/Features/0X-*.md` files for any feature pages relevant to this phase
7. `./docs/Quality/Bugs to Avoid.md` — failure patterns to watch for

Then briefly state in one paragraph: which phase you are executing, what the goal of that phase is, and how many tasks it contains. This sanity-check confirms you have context.

---

## Your job this session

1. **Identify the current phase** in TASKS.md — the first phase with at least one unchecked `[ ]` task.

2. **Implement every unchecked task in that phase, in order.** Within a phase, tasks are listed in a sensible build order — follow it.

3. **For each task:**
   - Write the component, screen, or wiring
   - Import design tokens from `@/lib/design/tokens` — NEVER hardcode colors, spacing, font sizes, border radii, or shadows
   - Use Apple UI native components from `expo-ui` where available (Sheet, Picker, DatePicker, Toggle, Stepper, Section, List, ContextMenu)
   - Apply iOS HIG: 44pt minimum tap targets, Dynamic Type respected, accessibility labels on every interactive element
   - Add `testID` for testing hooks
   - Add `accessibilityLabel` and `accessibilityRole` for VoiceOver
   - Match the layout description in `App Screens.md` exactly — if the doc says "three-zone vertical layout," build three zones
   - Use mock data for anything that would require a backend (e.g., `const today = { streak: 12, xpEarned: 47, gymLogged: false }`)

4. **After each task:**
   - Mark the task `[x]` in TASKS.md
   - Run `npx tsc --noEmit` — must pass before moving on
   - Save TASKS.md

5. **After the phase is complete:**
   - Run `npx tsc --noEmit` one final time
   - Run a quick Metro start to verify nothing crashes:
     ```bash
     timeout 20s npx expo start --ios &
     sleep 15
     kill %1 2>/dev/null || true
     ```
   - `git add -A && git commit -m "phase N: <phase name>"`
   - Append a session log entry to TASKS.md under "Session log":
     ```
     ### YYYY-MM-DD — Phase N
     - What was completed (one bullet per task or grouped sensibly)
     - Any decisions made that the docs didn't cover
     - Any tasks marked [?] and why
     - Anything noteworthy for the next session
     ```
   - **Stop.** Do not start the next phase. The user will review and start the next session with this same prompt.

---

## Critical rules

### Visual integrity
- **No hardcoded colors, spacing, font sizes, border radii, or shadows** outside `/lib/design/tokens.ts`. If you need a value the tokens don't have, ADD it to tokens.ts rather than hardcoding.
- **No emoji in UI** unless `App Screens.md` specifically calls for one.
- **One accent color only.** If you find yourself reaching for a second color, you're probably wrong — check the tokens file.
- **No gradients, no glassmorphism, no skeuomorphism.**

### Scope discipline
- **No new dependencies** unless tokens.ts or an existing component genuinely cannot accomplish what's needed. If you must add one, note it in the session log with the reason.
- **No backend calls.** Use mock data inline. Backend integration is Phase 12 (out of scope for now).
- **No "while we're here" refactoring** of code outside the current phase.
- **No skipping accessibility.** Every interactive element needs `accessibilityLabel` and tap target ≥ 44pt.

### Quality gates
- **No commits without `npx tsc --noEmit` passing.**
- **Every screen needs an `accessibilityLabel`** on its main heading.
- **Every interactive element needs `testID`** for future test hooks.
- **Every `Pressable` needs haptic feedback** (use `expo-haptics` with `ImpactFeedbackStyle.Light` on primary buttons, `Selection` on toggles).

---

## When stuck

If you cannot resolve an error after 3 attempts:
1. Mark the task as `[?]` in TASKS.md with a one-line note about what's blocking
2. Skip it, move to the next task in the phase
3. Note it in the session log so the user can help next session

If a doc contradicts another doc:
1. `App Screens.md` wins for layout of a specific screen
2. `UI & Design System.md` wins for general patterns
3. iOS Human Interface Guidelines wins as a tiebreaker
4. Match the closest existing screen in the codebase
5. Note the conflict in the session log so the user can clarify

If a screen needs an icon and the doc doesn't specify which:
- Use `@expo/vector-icons` Ionicons by default
- Pick something sensible and note your choice in the session log

---

## Style conventions

- Functional components only, no classes
- `export default` for screens, named exports for components and utilities
- TypeScript strict — no `any` types
- File names: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- Imports in this order:
  1. `react`, `react-native`
  2. `expo-*`, `@expo/*`, third-party libs
  3. `@/lib/*`, `@/components/*`
  4. Relative imports (`./foo`)
- 2-space indentation
- Match the semicolon style Expo init produced

---

## Component template

When creating a new component, follow this shape:

```tsx
// /components/<category>/ComponentName.tsx
import { View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { color, type, space, radius } from '@/lib/design/tokens';

type Props = {
  // ... typed props
  testID?: string;
  accessibilityLabel?: string;
};

export function ComponentName({ testID, accessibilityLabel, ...props }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // ... handler
      }}
      style={{
        backgroundColor: color.white,
        borderColor: color.gray200,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: space.lg,
        minHeight: 44,
      }}
    >
      {/* ... */}
    </Pressable>
  );
}
```

---

## Screen template

When creating a new screen:

```tsx
// /app/<route>.tsx
// <SCREEN_ID> · <Screen name>
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, space } from '@/lib/design/tokens';

export default function ScreenName() {
  // mock data
  const data = {/* ... */};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        {/* layout per App Screens.md */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Begin

1. Read TASKS.md
2. Identify the current phase
3. Read the relevant docs (Design + Features for this phase)
4. State your understanding in one paragraph
5. Start the first unchecked task in the phase
6. Work through every task in the phase
7. Run quality gates, commit, log, and stop

The session is complete when:
- Every task in the phase is `[x]` or `[?]`
- `npx tsc --noEmit` passes
- Metro starts without crashing
- A session log entry exists at the bottom of TASKS.md
- A git commit captures the work

Do not start the next phase. Stop after the current phase is complete and wait for the next session.
