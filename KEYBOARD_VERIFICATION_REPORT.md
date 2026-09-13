# Keyboard verification — 2026-09-13 (addendum)

**Outcome: Step 0 failed. The keyboard check was not run, and nothing was built.**
No code changed this session, so the baselines stand untouched at 65 suites / 823
tests (app) and 632 / 0 skip (backend).

---

## Did the permission fix work? No — same error, byte for byte

The exact probe from last session, retried first thing:

```
tell application "System Events" to get position of window 1 of process "Simulator"
→ -1331, -1004                                                        ✅ reads still work

tell application "System Events" to click at {-1127, -314}
→ execution error: System Events got an error:
  osascript is not allowed assistive access. (-25211)                  ❌ unchanged
```

Granting Accessibility to "claude.app" did not change the click path. Per
instruction I stopped there: none of the four exhausted routes (native simulator
tool, full-screen control approval, raw-input drag, AX-focus-only) was retried,
and Task 1 was skipped rather than faked.

## Why it still fails — and the one thing not yet tried

Two diagnostics narrow this further than last session.

**1. Assistive access is globally on.** `UI elements enabled` returns `true`, and
System Events reads succeed. So this is not a global switch; it is a
per-responsible-process denial.

**2. There are two different bundles named `claude.app`.** The process ancestry
of the shell these commands run in:

```
/bin/zsh
 └─ /Users/…/Library/Application Support/Claude/claude-code/2.1.266/claude.app/Contents/MacOS/claude
     └─ /Applications/Claude.app/Contents/Helpers/disclaimer
         └─ /Applications/Claude.app/Contents/MacOS/Claude
```

macOS attributes a TCC check to the **responsible process**, which here resolves
up to `/Applications/Claude.app` — not to `/usr/bin/osascript` (granted two
sessions ago, which fixed only reads) and not necessarily to the embedded
`…/claude-code/2.1.266/claude.app` bundle, whose path is version-stamped and
changes on every update.

So "grant Accessibility to claude.app" is ambiguous, and the grant probably
landed on the wrong one of the two. **The one specific thing not yet tried** is
adding **`/Applications/Claude.app`** — the desktop app in `/Applications`, not
the embedded CLI bundle under `Application Support` — to System Settings →
Privacy & Security → Accessibility.

## Is real touch input achievable here at all?

**Honest answer: possibly, with exactly one more attempt — but it should not be
relied on, and I would not spend a fifth pass on it.**

- **Worth one try:** granting `/Applications/Claude.app` specifically. That is a
  concrete, previously-untried target, and the evidence above says it is the
  process macOS is actually judging.
- **Why it stays fragile even if it works:** the embedded CLI bundle carries a
  version number in its path (`2.1.266`). If the responsible process ever
  resolves to that bundle instead, the grant breaks on the next update and this
  whole investigation repeats.
- **If that grant fails too, treat it as a permanent limitation of this
  environment.** Five distinct mechanisms across four passes have now been
  exhausted; a sixth is not a good use of time.

### The durable alternative, if this check matters

Keyboard-avoidance behaviour can be tested from **inside** the simulator rather
than by driving the host UI, which sidesteps host TCC entirely — an XCUITest
target typing into the field, or Maestro/Detox driving the app. That is a real
piece of setup (this repo is Expo/RN with no native test target today), so it is
a proposal, not something done here. It would also make this check repeatable in
CI instead of a manual ritual.

Otherwise this is a 30-second manual check for a human at the machine: open
`gym/log-session`, tap Notes, and look at whether the keyboard covers the pill.

## What is and is not known about V1's keyboard avoidance

Unchanged from last pass — stated again so the status is not misread as progress:

- **Verified:** at the `fitToContents` detent the whole form and the save pill are
  on screen at rest (device screenshots, earlier passes).
- **Verified by code reading:** `SheetContent` wraps its body in a
  `KeyboardAvoidingView` (`behavior="padding"`) around a `ScrollView` whose last
  child is the pill.
- **Still unverified:** whether the keyboard actually clears the pill and the
  focused field, on `gym/log-session`'s Notes field and `food/detail`'s number
  fields. No screenshot of a raised keyboard exists, because no input path in
  this environment raises one.

## Session hygiene

No simulator settings were changed this session (the hardware-keyboard toggle was
restored at the end of the previous one and was not touched). No servers were
started. No files changed other than this report and the DECISIONS.md entry.
