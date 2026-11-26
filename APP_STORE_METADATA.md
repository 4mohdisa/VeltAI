# App Store Metadata — Draft (English)

The product is **Lume**, bundle `fit.lume.app` (app.json). English only for
launch; es and fr listings come later. Character counts in brackets were
measured, and each is within the App Store Connect limit shown.

**App name:** Lume — Calorie & Workout Tracker
**Primary category:** Health & Fitness
**Secondary category:** Food & Drink

---

## Subtitle (max 30 chars)
`Calorie & workout tracking`  *(26)*

## Promotional text (max 170 chars)
`Log meals by photo, barcode or label scan. Track workouts with calorie math that shows its working. See your daily energy balance. No ads.`  *(138)*

## Keywords (max 100 chars, comma-separated)
`calorie counter,macro tracker,food diary,workout log,gym,fitness,nutrition,barcode,meal scan,streak`  *(99)*

## What's new (version 1.0)
`Welcome to Lume. Log food by photo, barcode or label, track workouts and your weekly schedule, and see your daily energy balance in one place.`  *(142)*

## Support URL
`https://lume.fit/support`

## Privacy policy URL
`https://lume.fit/privacy`

## Marketing URL
`https://lume.fit`

These come from `SITE_URL` in `web/lib/site.ts` and the pages in
`web/app/support`, `web/app/privacy` and `web/app/terms`.

---

## Description (max 4000 chars)

Lume is a food and workout tracker that shows its working.

When you log cardio, Lume asks for the details that change the result, such as
speed, incline, power and steps, and estimates your burn from the published
ACSM metabolic equations. Every number shows how it was worked out and how sure
Lume is about it.

LOG FOOD IN SECONDS
• Snap a meal and get an estimate of portions, calories and macros
• Scan a nutrition label to capture a packaged food
• Search the food database or scan a barcode
• Quick add calories when you're in a hurry
• Save meals and recipes you eat often
• Filter for halal and other dietary preferences

TRACK YOUR WORKOUTS
• Build workout templates and a weekly schedule
• Check off exercises as you go, logging sets, reps and weight
• For cardio, enter the real settings and see the calorie estimate update
• Keep a streak going, with a freeze to protect it on a rough week

SEE YOUR DAILY ENERGY BALANCE
Food in, energy out (your resting burn plus exercise) and your goal, side by
side for the day and the week.

INSIGHTS FROM YOUR OWN DATA
A short morning brief, gentle insights and Ask Lume for questions about your
own logs. The app works out the numbers; AI only writes the summary, and only
after you agree to it.

REMINDERS ON YOUR TERMS
Meal, workout and streak reminders with per-type switches and quiet hours.

CONNECT YOUR APPS (optional)
Import workouts from Strava and WHOOP so they use the same calorie engine.

PRIVATE BY DESIGN
Your data is never sold and never used for advertising, and there are no ad
SDKs in the app. Product analytics stay off unless you turn them on. You can
export or permanently delete everything from Settings at any time.

Lume is a wellness and information tool. It is not medical advice and does not
replace a doctor or a dietitian.

A subscription unlocks Lume after the trial.

---

## Health disclaimer

Lume is not medical advice and does not replace a doctor or a dietitian. It is
a wellness and information tool, not a medical device. Calorie, macro and
energy figures are estimates to help you track your own habits; they are not a
diagnosis or a treatment plan. Talk to a doctor or a dietitian before changing
your diet or training, especially if you are pregnant, have a medical condition
or have a history of disordered eating.

The listing description (above) carries the same line. It agrees with the
in-app disclaimer (`healthDisclaimer.text`) and the Terms
(`legal.terms.healthDisclaimer`), which say "a healthcare professional".

---

## Privacy nutrition label (App Privacy answers)

These answers follow `PRIVACY_DATA.md` and `app.json` `ios.privacyManifests`.
Update all three together.

**Data used to track you:** none. Lume does not track, has no ad SDKs and
shares no data with data brokers.

**Data linked to you:**

| App Store data type | What it covers in Lume | Purposes |
|---|---|---|
| Health | Food logs, goals and body weights | App functionality |
| Fitness | Gym sessions | App functionality |
| Photos or videos | Meal and label photos sent for AI analysis, after the AI disclosure is accepted | App functionality |
| Other user content | Ask Lume questions | App functionality |
| Customer support | Messages sent from Settings > Help and feedback | App functionality |
| Product interaction | Analytics events, only when analytics is turned on (off by default) | Analytics |
| Other diagnostic data | Build labels on analytics events; device model in feedback, only when its switch is on | App functionality, analytics |

**Data not linked to you:**

| App Store data type | What it covers in Lume | Purposes |
|---|---|---|
| Crash data | Crash reports with user, request and breadcrumb data removed | App functionality |

**Not yet declared, owner to decide:** account data (email and name through
the sign-in provider, and the user ID) is not in `PRIVACY_DATA.md` or the
manifest yet. This is the open Row 12a item in `OWNER_CHECKS_phase4.md`.

**Services that process data for Lume:** sign-in (Clerk), database (Supabase),
photo analysis, insights and Ask Lume (Google Gemini; Anthropic only if the
server is switched to it), subscriptions (RevenueCat), crash reports (Sentry,
only when configured), product analytics (PostHog, only when configured and
turned on), food search text (Open Food Facts and, when configured, USDA
FoodData Central), and optional imports (Strava, WHOOP).

**Deletion:** Settings > Delete my account removes the sign-in identity and all
data straight away.
**Export:** Settings > Privacy > Export my data.

---

## Age rating answers

Expected rating: 4+. Confirm each answer against the current questionnaire in
App Store Connect.

| Question area | Answer |
|---|---|
| Violence (cartoon, realistic, graphic) | None |
| Sexual content or nudity | None |
| Profanity or crude humour | None |
| Alcohol, tobacco or drug use or references | None |
| Mature or suggestive themes | None |
| Horror or fear themes | None |
| Simulated gambling, contests | None |
| Medical or treatment information | None: general wellness tracking only, no diagnosis or treatment |
| Health or wellness topics | Yes: food, calorie and workout tracking |
| Unrestricted web access | No |
| User-generated content shared with other users | No: nothing a user enters is shown to anyone else |
| Messaging or chat with other people | No |
| AI-generated content | Yes: insights, the morning brief and Ask Lume answers about the user's own data |

---

## Subscription (App Store Connect)

One subscription group, **Lume Pro**, unlocking the `pro` entitlement
(`PRO_ENTITLEMENT` in `src/lib/billing/purchases.ts`). Prices are set in App
Store Connect only and are never written here.

| Reference name | Display name | Description (max 55 chars) |
|---|---|---|
| Lume Pro Monthly | Monthly | `Every Lume feature, renewed each month.` *(39)* |
| Lume Pro Annual | Annual | `Every Lume feature, renewed each year.` *(38)* |

Both auto-renew. The introductory offer in App Store Connect must match
`TRIAL_DAYS` in `src/lib/billing/purchases.ts`.

---

## Review notes

**What Lume is:** a food and workout tracker. Everything works offline-first
and syncs to Lume's backend after sign-in.

**Demo account recipe:**
1. Before submitting, create one review account in the production sign-in
   instance. Use the email in the `E2E_EMAIL` environment variable and the
   password in the `E2E_PASSWORD` environment variable. The values are never
   written in this file, the repo, notes or screenshots.
2. Sign in once as that account and finish onboarding, so the reviewer lands on
   the main tabs.
3. Log a few meals and one workout on that account, so the energy balance,
   insights and history screens have data.
4. Enter the same two values in App Store Connect > App Review Information >
   Sign-in required.

**Where to look:**
- Sign in: email and password with the demo account. Sign in with Apple is next
  to the other sign-in options.
- Subscription: the paywall appears after onboarding. Purchases in review run
  in the App Store sandbox. Restore purchases is on the paywall and in
  Settings > Subscription.
- AI features: the first photo scan or insight shows a one-time AI disclosure.
  Nothing is sent to an AI service until it is accepted.
- Account deletion: Settings > Delete my account deletes the account and all
  its data straight away.
- Data export: Settings > Privacy > Export my data.
- Strava and WHOOP imports are optional and need the reviewer's own accounts;
  the rest of the app works without them.
- Lume does not read or write Apple Health in this version.

**Health:** Lume is not medical advice and does not replace a doctor or a
dietitian. Calorie and energy numbers are estimates.

---

## Screenshot plan

iPhone only (`supportsTablet` is false). Capture at 6.9 inch (1320 × 2868) and
let App Store Connect scale it for smaller sizes. Use the demo account with
realistic sample data, light mode, a full battery and 9:41 in the status bar.
No real personal data, no email addresses and no prices in any frame.

| # | Screen | Caption |
|---|---|---|
| 1 | Today: energy balance and macro ring | See your day at a glance |
| 2 | Photo scan result with portions and macros | Snap a meal, get an estimate |
| 3 | Barcode or nutrition label scan | Scan packaged food in seconds |
| 4 | Cardio log with speed and incline | Calorie math that shows its working |
| 5 | Gym session with sets and reps | Log every set as you go |
| 6 | Weekly schedule and streak | Plan your week, keep your streak |
| 7 | Morning brief or an insight card | Insights from your own data |
| 8 | Settings > Privacy with export and delete | Your data, under your control |
