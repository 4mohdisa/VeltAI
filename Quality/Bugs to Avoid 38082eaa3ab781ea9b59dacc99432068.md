# Bugs to Avoid

Documented failures from LOCKED (Evan Yadegari) and Cal AI (Zach Yadegari). Each has a direct fix built into Veltai.

---

## From LOCKED

### BUG-001 · Forced 5-star rating in onboarding

**Their failure**: Shown before the user used the app. Inflated ratings.

**Veltai fix**: Rating prompt only fires after a 7-day gym streak. Never in onboarding.

### BUG-002 · Habits don't auto-reset

**Their failure**: Yesterday's completions carried over.

**Veltai fix**: Server-side cron at 00:00 UTC. Completions queried by date, never "reset" client-side.

### BUG-003 · XP farming exploit (unmark/remark)

**Their failure**: Tap to complete = XP. Untap and retap = more XP. Infinite.

**Veltai fix**: `UNIQUE(user_id, habit_id, completed_date)` constraint on `gym_sessions`. XP insertion uses `ON CONFLICT DO NOTHING`. Database-level enforcement.

### BUG-004 · Deceptive paywall

**Their failure**: App Store listed "in-app purchases" implying free tier. Paywall couldn't be closed.

**Veltai fix**: One price, shown everywhere ([veltai.app](http://veltai.app), App Store listing, in-app paywall). Visible close button. Preview mode if user closes.

### BUG-005 · App resets mid-subscription, double-charges

**Their failure**: Random profile resets. Lost data. Re-prompted to pay.

**Veltai fix**: All data in PostgreSQL tied to Clerk user ID. RevenueCat `restorePurchases()` on every launch. Profile survives reinstall.

### BUG-006 · No undo on habit completion

**Their failure**: Accidental tap = stuck.

**Veltai fix**: Toggle works in both directions within UTC day. XP is removed from ledger on uncheck. After midnight, completions are locked.

### BUG-007 · Levelling up felt empty

**Their failure**: Rank change = text colour change. Nothing tangible.

**Veltai fix**: Each rank unlocks something — streak freeze tokens, profile badge, themes. Animated rank-up modal. See Gamification page.

### BUG-008 · Crashes and "app doesn't work"

**Their failure**: Multiple reviews mention app simply not running.

**Veltai fix**: Sentry from day one. Network timeouts on every API call. Offline state handled gracefully — clear indicator, not blank screen.

---

## From Cal AI

### BUG-009 · AI silently guesses hidden ingredients

**Their failure**: Oil, butter, sauces ignored or guessed. Calorie estimates 25–50% low.

**Veltai fix**: **Uncertainty prompt flow.** When Gemini confidence < 0.75 on any ingredient, surface a card asking the user. "This looks oily — dry / light / medium / heavy?" User confirms. Confirmed data used in final calculation.

### BUG-010 · Dynamic hidden pricing

**Their failure**: Price hidden until full onboarding completed. A/B price testing showed different users $2.49 vs $9.99.

**Veltai fix**: A$9.99/month. One price. Shown on [veltai.app](http://veltai.app), App Store, paywall. No A/B price testing.

### BUG-011 · Deceptive billing — Apple pulled the app

**Their failure**: Stripe-based subscription inside the app bypassing IAP. Weekly pricing more prominent than billed amount. Removed from App Store April 2026.

**Veltai fix**: All payments via RevenueCat → StoreKit. Never Stripe inside the app for digital subscriptions. Paywall shows monthly price, annual price, trial, auto-renewal in plain language.

### BUG-012 · 3.2M user data breach via unauthenticated Firebase

**Their failure**: Firebase backend had unauthenticated read access. 14.59 GB of user data including names, weight, meal logs, 4-digit PINs exposed.

**Veltai fix**:

- Go backend, no Firebase
- Every route validates Clerk JWT server-side
- Row-Level Security on every Supabase table
- No 4-digit PINs — industry-standard session tokens
- Secrets in environment variables only

### BUG-013 · Post-payment app freeze

**Their failure**: After paying, app froze, scan returned errors.

**Veltai fix**: RevenueCat entitlement check before locked features. Retry with exponential backoff. Scan errors show clear retry button, never blank screen.

### BUG-014 · Can't correct AI guesses, model doesn't learn

**Their failure**: Same wrong estimate repeatedly for the same foods.

**Veltai fix**: Every correction stored in `food_scan_corrections`. Per-user food memory pre-fills uncertainty prompts for familiar dishes. Anonymised corrections feed company training pipeline.

---

## Cross-cutting prevention

| Issue | Root cause | Our prevention |
| --- | --- | --- |
| Inflated reviews | Prompted too early | Wait for 7-day streak |
| Data loss | Client-side state only | All data server-side |
| Subscription not restored | No restore flow | `restorePurchases()` on every launch |
| Hidden costs | Dark patterns | One price, shown everywhere |
| Security breach | Unauthenticated endpoints | JWT + RLS on every table |
| Silently wrong AI | No uncertainty handling | Uncertainty prompt for every low-confidence ingredient |
| Empty gamification | No real rewards | Cosmetic unlocks + visual feedback |

---

## App Store hygiene

### BUG-015 · Pre-promising rewards for ratings or reviews

**The rule**: Apple's App Store Review Guidelines (1.1.6) prohibit incentivising ratings or reviews. Apps that do this get rejected or pulled.

**Veltai application**: The `SKStoreReviewController.requestReview()` prompt fires only after a 7-day gym streak — a genuine positive moment — and is never coupled to any reward. No copy in the app ever says "rate us for X." The same hygiene applies to any internal feedback prompts we add later: never pre-promise a reward for a rating, even when it's our own internal data not an App Store review. Pre-promising biases the response and breaks user trust.

**Rule**: Never include "rate us for X" copy anywhere. Never offer XP, trial extensions, or feature unlocks for ratings. The review prompt stands alone, triggered only at moments of genuine accomplishment.