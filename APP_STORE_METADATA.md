# App Store Metadata — Draft

> **Naming note:** the shipping config (`app.json`, bundle `app.veltai.veltai`)
> uses **Veltai**; the product docs use **Lumo**. Pick one before submission — this
> draft uses "Lumo" as the plan intends. See MORNING_REPORT_PHASE12 → human action.

**App name:** Lumo — Calorie & Workout Tracker
**Primary category:** Health & Fitness
**Secondary category:** Food & Drink

---

## Subtitle (max 30 chars)
`Calorie & workout tracking`  *(26)*

## Promotional text (max 170 chars)
`Log food by photo, barcode or voice. Track workouts with real ACSM calorie math — not a flat guess. See your true energy balance. Private by design, no ads.`  *(154)*

## Keywords (max 100 chars, comma-separated)
`calorie counter,macro tracker,food diary,workout log,gym,fitness,nutrition,weight loss,ACSM,streak`  *(98)*

## Support URL
`https://lumo.fit/support`

## Marketing URL
`https://lumo.fit`

---

## Description (max 4000 chars)

Lumo is a food and fitness tracker that does the math honestly.

Most calorie apps treat every "treadmill" the same. Lumo doesn't. When you log
cardio, it captures the details that actually matter — speed, incline, power,
split, steps — and computes your burn from the published ACSM metabolic
equations, the same standard sports scientists use. Every number shows its
working, so you can see exactly how it was calculated and how confident it is.

LOG FOOD IN SECONDS
• Scan a meal with your camera — a multi-pass pipeline estimates portions and macros
• Scan a nutrition label to capture packaged foods exactly
• Search a food database or scan a barcode
• Describe a meal by voice
• Quick-add calories when you're in a hurry
Lumo learns your typical portions over time and gets more accurate the more you log.

TRACK WORKOUTS THAT COUNT
• Build workout templates and a weekly schedule
• Check off exercises as you go, logging sets, reps and weight
• For cardio, enter the real parameters and get a live, precise calorie estimate
• Rate effort (RPE) to track progression
• Keep a streak going, with a freeze to protect it on a rough week

SEE YOUR TRUE ENERGY BALANCE
Calories in (food) vs calories out (your BMR plus exercise) vs your goal — a clear
daily and weekly picture, so you always know where you stand.

SMART INSIGHTS, NOT NAGGING
A short morning brief and gentle insights, generated from your own data. The app
computes the numbers; AI only writes the plain-English summary.

CONNECT YOUR GEAR (optional)
Import workouts from Strava and WHOOP so device activities use the same calorie
engine. Apple Health support is on the way.

PRIVATE BY DESIGN
Your health data is yours. It is never sold, never used for advertising, and there
are no ad SDKs in the app. Meal photos are processed to produce an estimate and are
not retained. You can export or permanently delete everything from Settings at any
time.

Lumo is a wellness and informational tool, not a medical device, and does not
provide medical advice.

Start free, then unlock everything with a 7-day trial.

---

## Privacy Nutrition Label (App Privacy answers)

**Data used to track you across apps/websites:** NONE. Lumo does not track. No ad
SDKs, no third-party analytics that identify you, no data shared with data brokers.

**Data linked to your identity** (tied to your account):
| Type | Examples | Purpose |
|---|---|---|
| Health & Fitness | food logs, workouts, body stats, calorie/energy data | App functionality |
| Contact Info | email (via the auth provider) | App functionality, account management |
| User Content | meal photos (processed, not retained), notes | App functionality |
| Identifiers | account user ID | App functionality |

**Data NOT linked to your identity:** none collected separately.

**Data NOT collected:** location, contacts, browsing history, search history,
financial info, purchases (handled by Apple), advertising data.

**Third-party processors** (act on Lumo's behalf, under their own terms, only to
provide their part of the service): authentication (Clerk), database (Supabase),
photo/label analysis (Google Gemini), AI summaries (Anthropic), subscriptions
(RevenueCat), optional imports (Strava, WHOOP).

**Data deletion:** Settings → Delete my account removes all data (cascading delete).

---

## Age rating
4+ (no objectionable content). Health/fitness tracking; not a medical device.

## Subscription (App Store Connect)
- Monthly — US$8.99, 7-day free trial, auto-renewing
- Annual — US$49.99, 7-day free trial, auto-renewing
