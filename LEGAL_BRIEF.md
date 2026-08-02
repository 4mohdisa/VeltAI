# Lumo — brief for an Australian privacy lawyer

Prepared 2 August 2026. Everything below marked **verified** was read out of the
source code, not from a marketing document. Nothing is aspirational.

**What I need:** drafting for a Privacy Policy and Terms of Service. The
structure exists and is scaffolded section by section — 31 sections are marked
TODO and are listed in §7. The gaps are known; this is a drafting engagement,
not a discovery one.

---

## 1. What Lumo is

Lumo is a pre-launch iOS food and fitness tracker. Users log meals — by search,
barcode, photograph of a nutrition label, or photograph of the plate — and log
gym sessions; the app computes calorie and macronutrient targets, exercise
energy expenditure, and a daily energy balance.

It is **not released**. No Apple Developer submission has been made, there are no
users, and no subscription product is configured.

The operating entity is Australian (Adelaide, South Australia). **The legal
entity is not identified anywhere in the codebase or on the website** — that is
the first thing I need from this engagement.

---

## 2. What it collects — verified

Lumo **collects health information**, which is sensitive information under the
Privacy Act 1988 (Cth). That is the fact that drives this engagement.

| Category | Specifics | Source |
|---|---|---|
| **Health** | Body weight, height, age, sex; activity level; stated goal; calorie/protein/carb/fat/fibre targets; body-weight history over time | `supabase/migrations/20260711000001_initial_schema.sql` (`onboarding`, `goals`, `body_weight`) |
| **Fitness** | Gym sessions, exercises and parameters, weekly schedules, streaks | same migration (`gym_sessions`, `gym_exercises`, `gym_streaks`) |
| **Content** | Meal and nutrition-label **photographs**; food names, quantities, macros; notes; recipes | `food_logs`, `saved_foods`; `backend/internal/scan/` |
| **Account** | Email address, display name, avatar URL | `backend/internal/auth/profile.go:20-27` |
| **Identifier** | Authentication-provider user ID, the key for every row | `profiles.id` |
| **Usage** | A closed list of **12 event names only** — no food names, quantities, photos or health values | `src/lib/analytics.ts:31-44` |
| **Purchase** | Subscription status and expiry. Payment details never reach Lumo (Apple IAP) | `backend/internal/subscription/` |

---

## 3. Where the data goes — verified

| Processor | Receives | When |
|---|---|---|
| **Clerk** | Email, name; issues the user ID | Always (authentication) |
| **Supabase** | Every row of user data | Always (database hosting) |
| **RevenueCat** | User ID, purchase status | Always (subscriptions) |
| **Google Gemini** | **The meal/label photograph in full** | Per scan, after the user accepts the AI disclosure |
| **Anthropic** | **A summary of the user's logged data** — food logs, gym sessions, goals, streak, body weights | Per AI request, after the same disclosure |
| **Strava / WHOOP** | Authorisation to read activities | Only if the user connects them. **Not operational** — no OAuth app is registered, so connecting returns 503 today |

**All of these are overseas recipients.** Which countries each stores or
processes in is a configuration and corporate-structure question that cannot be
read from the codebase — see the APP 8 gap in §5.

Verified negatives, which I would like stated in the policy: **no advertising
SDK, no IDFA, no third-party tracking SDK, no sale of personal information, no
disclosure of health information for advertising.**

---

## 4. What consent exists today — and what does not

**Exists (verified, `src/lib/ai/consent.ts:19-43`):** before the first meal
photograph or AI request, the app shows a one-time disclosure naming Google
Gemini and Anthropic and refuses to send anything until the user accepts. The
acknowledgement is stored **on the device** (secure store, key `lumo.aiConsent`).

**Its limits, stated plainly:**

- It covers **disclosure to those two AI processors only**. It is not a consent
  to *collect* health information generally.
- It is **device-local**. There is no server-side record. `grep -rn consent backend/`
  returns nothing.
- Because it is device-local, it cannot gate anything that runs server-side.

**Does not exist:** any express consent mechanism for the collection of health
information under APP 3.3. This is the central gap.

> A branch (`audit/submission-readiness`, unmerged) adds a `profiles.ai_consent_at`
> column and gates every AI send on it server-side, fail-closed and revocable.
> **It is not merged and not deployed**, so the policy must not describe it. I
> mention it only so you know the direction of travel.

---

## 5. The gaps in the current documents

The existing policy is a reasonable plain-English product notice. It is **not an
APP-compliant privacy policy for an Australian entity handling health
information**. In priority order:

1. **APP 3.3 — express consent for sensitive information.** Not addressed at
   all. The policy describes collection as a fact, never as something consented
   to. *This is the one that matters most.*
2. **APP 1.4 — complaints procedure.** Entirely absent: no mechanism, no
   timeframe, no OAIC escalation path.
3. **APP 8 — overseas disclosure.** The processors are named but their
   cross-border character is not disclosed, and no countries are identified —
   despite meal photographs and body stats going to Google and Anthropic.
4. **Entity identification.** No company name, no ABN, no registered address,
   anywhere.
5. **No reference to the Privacy Act or the APPs at all**, while the Terms
   already commit to South Australian governing law. The business holds itself
   out as Australian everywhere except the one document where jurisdiction
   carries weight.
6. **Retention.** No periods stated for any category, and no position on
   backups. In-app deletion is immediate and destructive (verified,
   `backend/internal/auth/profile.go:156-172` — identity deleted first, then a
   full cascade, and a 502 without touching data if the identity delete fails),
   but backup retention is a hosting question that is still open.
7. **Australian Consumer Law and the liability clause.** The previous Terms used
   a US-style blanket "as is, no warranties of any kind" exclusion. ACL consumer
   guarantees cannot be excluded, and I understand a blanket exclusion may itself
   be misleading conduct under s18. I have removed the clause rather than
   redraft it myself.
8. **Age.** The Terms state a minimum of 16; **the app never asks for or
   verifies age at sign-up.** The two need to agree.

---

## 6. Questions I need answered

1. What form must express consent for collecting health information take here —
   at sign-up, at onboarding, or per-feature? What must be recorded, and for how
   long? Is a device-local acknowledgement ever sufficient, or must it be
   server-side?
2. Does transmitting a meal photograph to Google Gemini constitute disclosure of
   sensitive information requiring its own consent, separate from collection?
3. Does the Anthropic summary — food logs, gym sessions, goals, body weights —
   change that analysis, given it is a broader dataset than a single photo?
4. What must the APP 8 statement say, and do we need to take reasonable steps to
   ensure each overseas recipient complies, or can we rely on an exception?
5. Does Lumo fall under the Notifiable Data Breaches scheme, and what does the
   response plan need to look like?
6. Is analytics-on-by-default defensible for a health app, or should it be
   opt-in? (Currently opt-out — `src/lib/settings/store.ts:95`.)
7. What minimum age, and what enforcement is actually required?
8. What liability limitation is enforceable alongside non-excludable ACL
   guarantees, for a paid subscription health app?
9. Do the unfair-contract-terms provisions constrain a unilateral
   variation-of-terms right in a standard-form consumer contract like this?
10. Is a separate collection notice needed at the point of collection, in
    addition to the policy?

---

## 7. What I need back

Drafted wording for each section currently marked TODO. The scaffold is live at
`/privacy` and `/terms` on the website, and `web/scripts/check-legal.mjs`
prints the list at any time:

```bash
cd web && npm run check:legal
```

**Privacy policy — 15 TODO blocks:** who we are · scope · sensitive information
and consent *(2 blocks — the priority)* · purposes · processor contractual
position · overseas disclosure · retention periods · formal access/correction
process · post-deletion retention · complaints · analytics default · children ·
changes · privacy contact.

**Terms of service — 16 TODO blocks:** acceptance · who we are · eligibility and
age · service commitments · pricing and refunds *(2 blocks)* · free-tier changes
· acceptable use · content licence *(including the licence to send a photograph
to a third-party AI processor)* · intellectual property · third-party terms ·
**disclaimers and liability** · termination grounds · changes · governing-law
confirmation · notices contact.

Sections already written from the code and needing only your review, not
drafting: the collection inventory, the disclosure list, security measures, the
deletion mechanism, the health disclaimer, and the subscription mechanics.

**One request:** where a section cannot be completed because a business decision
is missing (retention periods, minimum age, entity details), tell me what
decision to make rather than drafting around it. I would rather have a visible
gap than wording that implies a position we have not taken.
