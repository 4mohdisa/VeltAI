# Design references: sign up, sign in and onboarding (row 2b)

Round 2b step 1, 25 Nov 2026. Research and audit only. No screen code was changed.

References come from the Mobbin MCP (iOS). The table describes patterns only. It contains no pixel copies, logos, brand art or copied wording. Lume keeps its own tokens, fonts, colours and components.

Searches run:
- search_flows: "calorie tracking app onboarding", "fitness app onboarding", "health app sign up".
- search_screens: "nutrition app sign in screen", "fitness app sign up screen with email and password", "calorie tracker onboarding activity level question".

## Patterns

| App | Flow or screen | Pattern | Why it works | What Lume will apply |
|---|---|---|---|---|
| [MacroFactor](https://mobbin.com/flows/0ff63cb6-0dce-488f-828a-5557cf884452) | Onboarding, first screen | One primary "Get started" button, with a separate "Already a user? Log in" row on the first screen | A returning user signs in with one tap and never sees the questions | Add a "Sign in" path on Welcome that goes straight to the auth screen in sign-in mode |
| [MacroFactor](https://mobbin.com/flows/0ff63cb6-0dce-488f-828a-5557cf884452) | Onboarding, section overview | A short checklist of the sections (basics, goal, program) shows where the user is | Sets expectations for a long form and makes progress visible | Keep ProgressDots. Consider labelling the two halves ("About you", "Your plan") instead of 10 bare dots |
| [MacroFactor](https://mobbin.com/flows/0ff63cb6-0dce-488f-828a-5557cf884452) | Onboarding, calorie estimate | The computed number is shown with an edit control and a "How did you calculate that?" option | Builds trust in a derived figure and makes it adjustable in place | Targets screen: add a one-line "how this was worked out" (inputs used), keep "Adjust manually" |
| [MacroFactor](https://mobbin.com/flows/0a083221-797f-4bb3-8e87-49652e70ae9f) | Creating an account | Account is created after the answers ("You're in. Create your account to continue"), Apple first, then Google, then email, legal line at the bottom | The user has invested effort before the ask, and the platform button comes first | Lume already does this. Keep the order and the bottom legal line |
| [Yazio](https://mobbin.com/flows/003557b1-194e-477c-b307-5e051fa87371) | Onboarding, goal | Single-select list of goals that includes "Gain weight" and "Something else" | Every user finds an answer; nobody is forced into the wrong goal | Review Lume's 4 goals: there is no gain or maintain option today |
| [Yazio](https://mobbin.com/flows/003557b1-194e-477c-b307-5e051fa87371) | Onboarding, secondary goals | Multi-select with checkboxes and a "None of the above" that is exclusive | Clear multi-select affordance, exclusive "none" | Lume's dietary step already makes "None" exclusive. Keep it |
| [Centr](https://mobbin.com/flows/848ee3f1-7bc7-403d-a2ff-f58b178fadfe) | Onboarding, "Step 2 of 8" | A text step counter in the header next to the back arrow | Exact position is readable, also by VoiceOver | ProgressDots already announces "Step N of 10" to VoiceOver. Consider showing the same text visibly |
| [Centr](https://mobbin.com/flows/848ee3f1-7bc7-403d-a2ff-f58b178fadfe) | Onboarding, account step | Account creation sits mid-flow as one numbered step, with consent checkboxes | Sign-up feels like part of the plan, not a wall | Lume's signup is step 6 of 10; keep it inside the flow |
| [Tonal](https://mobbin.com/flows/9f597ed6-aea4-4ec7-b573-48ea7484b164) | Setting up a fitness profile, summary | "Your goals are set" summary lists each answer, with "change any time in Profile" and a Back option | The user checks their answers before committing and knows they can edit later | Preview or Targets: list the user's own answers (goal, activity, diet) with a note that Profile can change them |
| [Tonal](https://mobbin.com/flows/9f597ed6-aea4-4ec7-b573-48ea7484b164) | Setting up a fitness profile, height and weight | Each measurement has a one-line reason under the question | Explains why sensitive body data is asked | Measurements: one reason line per field group (already has a subtitle; make it per field if space allows) |
| [Lifesum](https://mobbin.com/flows/86ba7bdd-0dd3-49e0-9c3d-b94dc7fdc9f1) | Creating an account | "Your personalised plan is ready", then sign-up options | Ties the account ask to a result the user wants | Lume's Preview already does this. Keep it |
| [Ladder](https://mobbin.com/screens/f64beb4f-4623-4961-b52a-06a0afdf249f) | Activity level | Each level has a title and a concrete line (days per week or steps per day) | Users pick more accurately when levels are concrete | Activity: add a short concrete line under each of Lume's 4 levels |
| [BitePal](https://mobbin.com/screens/6be72e1f-08f3-4a3a-85c1-6656805039aa) | Activity level | Cards with a small level indicator and a plain description | Scannable, no jargon | Same as above; reuse OptionCard with a subtitle rather than a new card |
| [Runna](https://mobbin.com/screens/76e8b99e-c746-4a91-9658-c20a804969ba) | Sign up | Email form first, then "or" and the social buttons, legal line above the main button | All options on one screen; no extra tap to reach email | Lume hides email behind a third button. Keep, but make the email stage reachable in one tap (it is) and add "Resend code" |
| [Gymshark](https://mobbin.com/screens/889f1cb4-538b-4700-8265-1221f846fd6f) | Create account | "Already have an account? Log in" directly under the main button | The switch between modes is next to the action it changes | Lume's toggle is in the right place; the screen title must follow the mode |
| [Fitbit](https://mobbin.com/screens/54c94766-3239-4b0b-bab4-540805b58ffb) | Welcome | One-line value statement with two sign-in buttons on the first screen | Returning users are never routed through first-run questions | Supports the Welcome "Sign in" change above |

## Audit of the current screens

Flow order (src/app/onboarding): Welcome (index), goal (1), activity (2), cuisine (3), dietary (4), preview (5), signup (6), measurements (7), body-type (8), targets (9), paywall (10), done. The launch gate is src/app/index.tsx and resume is src/lib/onboarding/resume.ts. After sign-in, the next screen is chosen in src/lib/onboarding/postAuth.ts.

None of these screens use i18n. Every string in the onboarding stack is hard-coded English. Row 2b will need en, es and fr keys for every string it touches.

### Screens and states

| Screen | File | States |
|---|---|---|
| Launch gate | src/app/index.tsx | Spinner while deciding; signed out → resume at last step or Welcome; signed in and completed → tabs; signed in, not completed or server unreachable → resume |
| Welcome | onboarding/index.tsx | One state: wordmark, headline, subline, "Get Started". No back, no progress |
| Goal | onboarding/goal.tsx | Unselected; selected (auto-advances after 300 ms, immediately under Reduce Motion) |
| Activity | onboarding/activity.tsx | Same as Goal |
| Cuisine | onboarding/cuisine.tsx | None selected (Continue disabled); one or more selected |
| Dietary | onboarding/dietary.tsx | Any selection, "None" exclusive; Continue always enabled |
| Preview | onboarding/preview.tsx | Insight cards built from cuisines and halal; trial footnote; "Create my account" |
| Signup | onboarding/signup.tsx | Clerk: buttons, email entry (inline error), code entry (inline error), busy per provider, error toasts, sign-up or sign-in mode. No Clerk key: dev buttons that skip auth |
| Measurements | onboarding/measurements.tsx | Empty; typing (errors only on filled fields); submitted (errors on empty required fields); unit toggles convert values; target weight only for lose or muscle |
| Body type | onboarding/body-type.tsx | Unselected; selected (auto-advance) |
| Targets | onboarding/targets.tsx | Derived kcal and macros; adjust sheet open; health disclaimer |
| Paywall | onboarding/paywall.tsx | Billing on: hosted paywall, then purchased, restored, cancelled, error or unavailable toast; billing off: Continue with dev note; restoring; submit error toast (server message or connection message) |
| Done | onboarding/done.tsx | Success check, auto-replaces to tabs after 750 ms with a toast |

### Dead ends

1. No sign-in from Welcome. A returning user (new phone, reinstall) must answer goal, activity, cuisine, dietary and preview before the signup screen shows "Already have an account? Sign in". Those answers are thrown away when the server says they already finished.
2. In sign-in mode the signup screen title still reads "Create your account".
3. The code stage has no "Resend code". If the email never arrives, the only way out is "Use a different email" and typing the same address again.
4. Resume lands on the saved step with an empty back stack (index.tsx redirects straight to it). The scaffold's back button calls router.back(), which then has nowhere to go. Needs a device check to confirm.
5. After auth succeeds on signup and the user reaches measurements, Back returns to the signup buttons with a live session. Pressing a provider again is likely to fail with a Clerk "already signed in" error. Needs a device check.
6. A session that expires or is revoked after signup but before the paywall resumes the user past signup while signed out. The final POST then fails with a 401 and a "check your connection" toast, and the flow never sends them back to sign in.
7. The paywall "unavailable" toast is written for a developer ("check the RevenueCat offering and paywall are configured"), not for a user.
8. Target weight on measurements has no validation. An empty or extreme value is accepted silently.

### Static explainer slides

- Welcome: static wordmark, headline and subline, one button. No sign-in.
- Preview: static insight cards. Only the cuisine and halal lines reflect answers; the two "always" lines are fixed copy.
- Paywall step: a static feature checklist and a pricing footnote shown before the hosted RevenueCat paywall, so the user sees two paywall-like screens in a row.
- Done: a 750 ms success beat that cannot be interacted with.

### Onboarding questions today

| Question | Today | Notes |
|---|---|---|
| Goal | Yes, single choice: lose weight, build muscle, eat healthier, track my nutrition | No gain-weight or maintain option |
| Diet | Yes: cuisines (multi, at least one) and dietary requirements (halal, vegetarian, vegan, gluten-free, dairy-free, none) | |
| Units | Partly: cm or ft/in and kg or lb toggles inside measurements | Display only; stored as cm and kg. No app-wide units question |
| Activity | Yes, single choice of 4 levels | Labels are short; no concrete days or steps |
| Training days | No | Nothing in the store, types or API asks for training days per week |
| Body data | Age, sex, height, weight required; target weight for lose or muscle; body type (5 options) | Body type options use emoji including a burger for "Overweight", which reads as a judgement |

## Rerun, 26 Nov 2026 (row 2b step 1)

The Mobbin MCP (plugin:mobbin) was connected and search_flows, search_screens and search_sections were callable from Claude Code. Four search_flows searches on iOS were run. Patterns already in the table above are not repeated. As before: patterns only, with no screenshots, logos, brand art or copied wording.

### search_flows "nutrition tracking app sign up"

| App | Pattern | Why it works for a first-run user | What Lume will apply |
|---|---|---|---|
| [Ladder](https://mobbin.com/flows/1dcc2dac-5324-4841-87f2-5bdb4b38d9ff) | A full-screen section title card ("Section 1, your goals") between groups of questions | Breaks a long questionnaire into named chunks so it feels shorter | Use it together with the "About you" and "Your plan" labels proposed above. Use a header label, not an extra screen, so the step count does not grow |
| [Ladder](https://mobbin.com/flows/1dcc2dac-5324-4841-87f2-5bdb4b38d9ff) | Each personal question (date of birth) has a one-line reason plus "never shared, always private" | A privacy promise placed where the data is asked lowers drop-off | Measurements: add a short privacy line next to the age and body fields, in Lume's own wording |

### search_flows "fitness app log in"

| App | Pattern | Why it works for a first-run user | What Lume will apply |
|---|---|---|---|
| [Hevy](https://mobbin.com/flows/df17cccd-1cf1-498f-9ba7-1a8e12b08b0a) | The sign-in screen has the email and password fields first, "Forgot password?" right above the main button, then "or" and the platform buttons | Returning users who used email find their path straight away, and recovery sits next to the action | Lume uses email codes, not passwords. Put "Resend code" (dead end 3 above) in the same place, just above the main button |
| [Peloton Strength+](https://mobbin.com/flows/1ad90a89-3df2-4e85-a210-7b81c4a3c26c) | The sign-in screen has a "Created your account with Apple? Learn more" hint | Prevents a user from typing an email when they actually signed up with Apple | When the email sign-in fails with "no account", show a hint to try the platform button they may have used |

### search_flows "calorie counter app onboarding"

| App | Pattern | Why it works for a first-run user | What Lume will apply |
|---|---|---|---|
| [MacroFactor](https://mobbin.com/flows/0ff63cb6-0dce-488f-828a-5557cf884452) | A computed number is explained in a short chat-like bubble, with "Got it", "How did you calculate that?" and Skip | Explains the number without a wall of text, and the user chooses how deep to go | Already covered by the Targets item above. No new change |
| [Yazio](https://mobbin.com/flows/003557b1-194e-477c-b307-5e051fa87371) | An intro card ("tell us a bit about you so we can tailor your plan") comes before the first question | Says why the questions are coming and what the user gets back | Welcome subline: say that the next questions build the plan. Change text only, keep the layout |

### search_flows "health app onboarding"

| App | Pattern | Why it works for a first-run user | What Lume will apply |
|---|---|---|---|
| [Google Health (Fitbit)](https://mobbin.com/flows/a15b0ddb-c03a-4e0f-b177-ac29e147777e) | The optional data consent has two equal-weight buttons ("No thanks" and "Agree") and says that the choice can be changed later in settings | The choice is real and nobody is nudged | Lume's AI consent screen already does this (Row 5). Keep it |
| [Google Health (Fitbit)](https://mobbin.com/flows/a15b0ddb-c03a-4e0f-b177-ac29e147777e) | The first home screen shows a dismissible "Let's get you set up" checklist with a count (0 of 3) | Moves optional setup out of onboarding without losing it | The optional steps Lume might add later (Health connection, reminders) go in a home checklist, not in onboarding. Parked: HealthKit and push are Phase 4 rows of their own |
| [Withings Health Mate](https://mobbin.com/flows/1b9c5c94-d6d6-4a61-b01b-4160881390ee) | Each policy (health data, terms) has its own short card and checkbox before Next | Every agreement is readable and explicit | Lume shows a legal line under the signup buttons. Keep that. A per-policy checkbox is not needed |
