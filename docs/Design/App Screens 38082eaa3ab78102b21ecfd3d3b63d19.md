# App Screens

Complete inventory of screens in the Veltai iOS MVP, organised by section. Each entry includes purpose and a brief layout description so the design intent is clear before building.

> **Visual direction (redesign):** All screens now follow the **pure monochrome, Cal AI-clean** language — see Theme & Design Tokens and UI & Design System. Black/white/grey only, grey fills not borders, full-pill buttons, generous spacing, heavy/light type contrast, SF Symbols icons, native iOS controls (light styling). The *layouts* below are unchanged; only the *skin* changes. Where a description says a colour (e.g. "destructive red", "green ring"), read it as monochrome: destructive = black text + confirmation copy; progress ring = black arc on gray200 track; streak flame = black `flame.fill`, not orange.
> 

---

## Navigation architecture

```
First launch
   ↓
Onboarding (19 screens, one-time)
   ↓
Main App
   ├── Dashboard tab
   ├── Food tab
   ├── Gym tab
   └── Profile tab
```

Modals and overlays appear over any tab.

---

## Section A — Onboarding (19 screens)

### A1 · Welcome

First screen. Black background (the only screen that breaks the white rule, for impact). Veltai logo centred, single tagline: *"Make going to the gym the easy choice."* Continue button at bottom.

### A2 · Value prop carousel

Three swipeable cards. Card 1: "Lock distracting apps until you go." Card 2: "AI coach that knows your life." Card 3: "Food tracking in 5 seconds." Each card has a single bold word + supporting line. Skip-to-end button top-right.

### A3 · Sign in / sign up

Clerk-provided UI. Sign in with Apple button at top, prominent. Email button below, equal-sized. Already-have-an-account link at bottom.

### A4 · What's been getting in the way?

Title at top. Eight multi-select option cards stacked vertically. Each card has the label and a check circle. Continue button activates once at least one is picked.

### A5 · What have you tried?

Same card-stack layout as A4 with six different options. Skip available.

### A6 · What frustrates you about fitness apps?

Same layout, six options + a free-text field at the bottom. All optional, with prominent Skip.

### A7 · Reflection

No inputs. Centered copy block ~6 lines, dynamically generated based on Phase 1 answers. Continue button at bottom. The screen breathes — generous whitespace, no other elements.

### A8 · Goal

Title: "Where do you want to be in 90 days?" Goal type as horizontal segmented control. If weight goal selected, weight slider + date picker appear below.

### A9 · Why

Title: "Why does this matter to you?" Multi-line text input, ~5 lines visible. Placeholder: "Tell us in your own words." Skip available but framed as useful.

### A10 · About you (body)

Four inputs on one screen: weight slider, height slider, age stepper, sex segmented control. Units toggle top-right.

### A11 · Your day

Three time pickers: wake time, sleep time, preferred gym time. Use native iOS time picker.

### A12 · Your gym

Two sliders: current sessions per week (0–7), target sessions per week (1–7). Visual diff shown ("from 1 to 4").

### A13 · Your eating

Three inputs: meals/day stepper, dietary restrictions multi-select chips, allergies multi-select chips.

### A14 · Your cuisines

Multi-select chips of cuisines (Pakistani, Indian, Mediterranean, Italian, Mexican, Japanese, Chinese, Thai, Middle Eastern, American, Australian, Other). Below: cooks-at-home segmented control.

### A15 · Wow moment

Top half: animated weight projection chart (current → goal over 90 days). Bottom half: tomorrow's personalised plan as a vertical timeline with food suggestions matching their cuisines. Below: lockout preview thumbnail.

### A16 · Lockout setup

Title: "Want us to lock distracting apps?" Toggle at top. When on: Apple's native Family Activity Picker, enforcement window picker, grace period selector. Skip available.

### A17 · Permissions

Native iOS prompts shown sequentially: HealthKit (with our explainer screen first), Notifications (with our explainer first).

### A18 · Paywall

The trust-building screen. Big "14 days free" headline, dated trial window, "Why 14 days?" explainer paragraph, Start Trial CTA, Restore Purchases button visible.

### A19 · First plan generating (loading)

Loading screen with rotating tips: "Building your weekly meal plan..." → "Setting your daily calorie target..." → "Scheduling your gym sessions..." Auto-advances to Dashboard.

---

## Section B — Dashboard tab

### B1 · Dashboard (home)

Three-zone vertical layout:

1. **Top zone (sticky)**: today's streak with flame icon, today's XP earned, current rank badge. Tap streak → streak detail. Tap rank → profile.
2. **Middle zone**: today's gym status — huge "Log gym session" button if not logged, "Logged ✓" with workout details if logged. Below: today's meals macros ring (calories vs target) + bar charts for protein/carbs/fat.
3. **Bottom zone**: today's AI plan card (next meal time, gym window, bedtime). Lockout status banner if active.

### B2 · Today's plan detail

Full-screen view of today's AI-generated plan. Vertical timeline from wake to bedtime. Each meal slot shows target macros + 3 suggested foods. Gym session marked. Tap any meal → Add Meal pre-filled with that slot.

### B3 · Lockout status

Shows which apps are currently blocked, grace time remaining today, emergency unlocks left this week. Big "Use grace period" button. Smaller "Use emergency unlock" requires 4-digit confirm code.

### B4 · Nutrition detail

Today's macros expanded view. Stacked bar of calories consumed vs target. Per-macro progress bars. Per-meal breakdown. Edit any meal from here.

---

## Section C — Food tab

### C1 · Food log (default)

Today's meals as cards in chronological order. Empty state: "Tap + to add your first meal." Floating + button bottom-right. Pull-to-refresh. Tap card → Meal Detail.

### C2 · Add meal — entry method picker

Full-screen modal with 4 large tappable cards in 2×2 grid: Photo, Voice, Barcode, Manual. Each card has icon + label + one-line description.

### C3 · Photo capture

Native iOS camera viewfinder full-screen. Capture button at bottom. After capture: "Add label photo?" prompt → optional second photo.

### C4 · Photo review

Captured photos shown at top. Below: AI-detected food items listed with confidence indicator (full opacity for high, lowered opacity for low). Each item has edit/remove. Bottom: total macros summary + Save.

### C5 · Uncertainty prompt sheet

Bottom sheet with single question card (e.g., "How much oil?"). Four option buttons. Live calorie preview updates with selection. Stacks to next uncertainty after answer.

### C6 · Voice entry

Big microphone button center-screen. Live transcript scrolling above it as user speaks. Stop button. After stop: review screen with parsed food items, same layout as C4.

### C7 · Barcode scan

Native iOS barcode-detection camera viewfinder. Auto-detects, no capture button. Shows scan reticle. On detect → product confirm.

### C8 · Barcode product confirm

Product name, image, base nutrition shown. Serving size picker. Save button.

### C9 · Manual food search

Search bar at top. Results from Open Food Facts + cached recent foods. "Add custom food" link at bottom. Tap result → serving size picker → Save.

### C10 · Custom food form

Form fields: name, calories per 100g, protein, carbs, fat, fibre. Save adds to user's custom food list.

### C11 · Meal detail (edit)

Existing meal shown with all food items listed. Edit any item inline. Delete meal button at bottom (destructive style, requires confirmation).

### C12 · Meal history

List view by date, descending. Each day shows: date, total calories, gym status (checkmark or dash). Tap day → that day's food log.

---

## Section D — Gym tab

### D1 · Gym log (default)

Top: large streak counter with flame, 30-day calendar grid below showing which days had sessions (filled circle), freezes (snowflake), and missed days (empty). Bottom: today's status — big "Log gym session" button if not logged, "Logged ✓" with verification badge if logged.

### D2 · Log gym session

Modal sheet. Optional inputs: duration slider, perceived effort 1–10, energy level 1–5, notes text field. Big "Log it" button. All inputs optional.

### D3 · HealthKit auto-detect banner

Appears at top of D1 when HealthKit detects a workout not yet logged. "We saw a [workout type] for [duration]. Log as today's session?" Yes/No buttons.

### D4 · Streak detail

Streak counter prominent at top. Below: list of upcoming 7 days, each with action (log session, apply freeze, or "scheduled"). Below that: longest-ever streak, total sessions, freezes available.

### D5 · Apply streak freeze

Confirmation sheet. "Use 1 of your X freezes for [date]?" Confirm/Cancel.

### D6 · Gym session history

Reverse chronological list of past sessions. Each entry: date, duration, verification badge (HealthKit verified or manual), notes if any. Tap → detail.

---

## Section E — Profile tab

### E1 · Profile main

Avatar at top, name, current rank badge with progress bar to next rank, total XP, current streak. Below: recent XP events (last 7 days). Below: settings list (link items).

### E2 · Settings list

Apple-style grouped settings list: Account, Subscription, Lockout, Notifications, Apple Health, Units, Privacy, Support, About.

### E3 · Account settings

Email (read-only from Clerk), display name (editable), avatar picker, units toggle. At bottom: "Delete Account" in destructive red.

### E4 · Subscription

Current plan: "Veltai Premium — A$9.99/month." Next renewal date. "Manage subscription" button (deep-links to iOS Settings). "Restore Purchases" button.

### E5 · Lockout settings

Toggle to enable/disable. App picker (Apple's Family Activity Picker). Enforcement window picker. Grace period selector. Emergency unlocks remaining this week.

### E6 · Notification preferences

List of toggles per notification type. Quiet hours start/end pickers. Daily cap stepper.

### E7 · Apple Health

Connection status (Connected / Not connected). What we read (data types). Deep link to iOS Settings for granular control.

### E8 · Units

Metric / Imperial segmented control.

### E9 · Privacy

Privacy policy link. Terms of use link. EULA link. Data export request (Phase 2).

### E10 · Support

Email support, FAQ link, app version info. "Send feedback" textarea (separate from any rating prompt).

### E11 · About

App version, build number, credits, third-party licenses link.

### E12 · Delete Account flow

Multi-step confirmation:

1. "Are you sure? This permanently deletes your account."
2. List of what will be deleted.
3. Type "DELETE" to confirm.
4. Final confirmation. On confirm → API call → sign-out → return to A1.

---

## Section F — Shared modals & overlays

### F1 · XP float-up animation

Not a separate screen. Overlay animation when XP is earned. "+25 XP" floats up from the source button and fades. 800ms. Optional confetti for streak milestones.

### F2 · Rank-up modal

Full-screen modal when user crosses a rank threshold. Animated badge reveal, rank name, list of unlocks. Continue button.

### F3 · Streak milestone modal

Full-screen modal at 7/30/100-day streaks. Flame animation, milestone count, XP bonus, streak freeze granted if applicable. Continue button. After 7-day streak: triggers `SKStoreReviewController` separately (not coupled to this modal).

### F4 · AI nudge in-app banner

Top-of-screen banner when an AI nudge fires while app is open. Dismissable. Tap → goes to relevant screen.

### F5 · Lockout blocked overlay (Strict mode only)

When user opens a blocked app during lockout, our Veltai overlay appears (requires Family Controls entitlement). Shows which app, "Gym not logged yet today" message, options to use grace period or emergency unlock.

### F6 · Loading skeleton

Standardised loading state for any screen fetching data. Greyed-out shapes matching the eventual layout. Used everywhere instead of spinners.

### F7 · Empty state

Standard component for any list with no data yet. Icon + line of text + suggested action button.

### F8 · Error state

Used when API calls fail. Icon + error message in plain language + Retry button. Sentry captures the error silently.

### F9 · Confirmation sheets

For destructive actions (delete meal, delete account, etc.). Bottom sheet with bold action text + cancel + destructive confirm.

---

## Screen count summary

| Section | Screens |
| --- | --- |
| Onboarding | 19 |
| Dashboard tab | 4 |
| Food tab | 12 |
| Gym tab | 6 |
| Profile tab | 12 |
| Shared modals | 9 |
| **Total** | **~62 distinct states** |

Many are minor variations of modals. Core unique screens to design: ~30.

---

## Build order suggestion (frontend-only)

If building UI first (no backend), tackle in this order:

1. **Tab shell + Dashboard B1** — get the navigation skeleton and the hero screen first
2. **Profile tab E1-E11** — most static, good warm-up for component library
3. **Gym tab D1-D6** — the streak/log core loop
4. **Food tab C1, C2, C9-C12** — manual flow first (no AI dependency)
5. **Food tab C3-C8** — photo/voice/barcode (mock AI responses initially)
6. **Onboarding A1-A19** — build last because it touches every component you've already built
7. **Modals F1-F9** — sprinkle in as needed during the above

Building onboarding last is counterintuitive but right: by then your component library is mature and reusable, so the 19 screens come together fast.

---

## Planned (next session) — Gym selfie verification

Not built yet. Documented here so the design is captured.

**Concept:** to make gym sessions hard to fake, logging a session triggers a **simultaneous front + back camera capture** (like BeReal). Front camera = a selfie proving it's the user; back camera = their surroundings proving they're actually in a gym. Both fire in one tap. The user is not blocked — they tap, both photos capture, and verification runs **in the background** so the flow feels instant.

**Why:** self-reported taps and even HealthKit workouts can be faked. A dual-camera capture is much harder to game and directly serves the anti-cheat philosophy in Bugs to Avoid.

**Open design questions (to resolve next session):**

- iOS dual-camera (`AVCaptureMultiCamSession`) only works on iPhone 11+ and is not exposed by `expo-camera` — needs a custom native module or config plugin.
- What confirms a "gym"? Options range from simply storing both photos as proof (no AI) to Gemini vision checking the back photo for gym equipment.
- What happens if background verification fails? Revoke the session? Flag it? Silently accept? This ties into the `gym_sessions` schema (a `verification_source` + `verification_status` field would be needed).
- Privacy: these are selfies in a gym. Storage, retention, and whether they're ever shown to anyone need a clear policy.

**Screen impact when built:** D2 (Log gym session) gains a dual-capture step; new screens for capture + a subtle "verifying" state; `gym_sessions` schema gains verification fields. Kept as a separate work item so the monochrome redesign stays a pure visual reskin.