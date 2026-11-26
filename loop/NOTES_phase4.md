# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT; soak exit met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only; es/fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 14a, 14b, 15 to 30, 31.
4. One screen or component per prompt, max 5 numbered steps.
5. Partly done gets ONE follow-up; flagged again: park leftover, move on.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with branch rule; no switching, pushing, merging.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10, 11, 12, 13, 14, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b (step f blocked); 7 (7c parked); 8 (code done, Maestro not run); 9 (leaving reason parked); 14a (parked Round 86).
- Checkpoints: Round 66 and 80 green (325 suites, 2,018 tests).

## Row 14a: parked Round 86
- Done: features.ts (11 keys); throttle.ts and tests; promptStore.ts with load filter and save result; recordLaunch at start-up; FeatureFeedbackChip with render tests.
- Leftover (parked): wire chip on barcode scan with sheet; feature_rated analytics; Settings feedback screen and backend route; 'Ask me for feedback' switch; npm run feedback; delete and export coverage; PRIVACY_DATA.md.
- Known: chip unwired (dead code: wire or delete before Row 31); chip reads state once on mount; save result ignored by callers; fast refresh counts an extra launch (dev only).

## Row 14b (current)
- DESIGN_INTENT.md first (four questions per screen, Fix list), then one small fix per prompt.

## Next after 14b
- Checkpoint: count console.warn suites (164 now, 82 at Round 66).
- terms.tsx onto legal.terms keys; health disclaimer; paywall subscription terms.

## Parked (Row 14 and legal)
- Health disclaimer link: web/lib/legal.ts lacks push, Sentry, PostHog lines.
- LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'.
- Banned word in legalParity comment (flagged twice).
- Paywall and signup LegalLink duplicates.
- Paywall footer on small iPhone: Row 23.

## Blocked on Isa (park)
- Leaving and retention: destination, reason and priming copy, win back copy and price, Apple Retention access, App Store Connect key, sandbox URL.
- Billing: 7c StoreKit needs iOS public key. Row 8: Maestro install, email sign in, expired, cancelled, past_due runs.
- Row 10: category strings, defaults, quiet hours wording, push token retention, DELETE public or gated, pod install.
- Row 11: Settings switch, purpose strings, real HealthKit provider, device steps.
- Row 12a: Email, Name, User ID label; push token manifest type.
- Row 13: age rating; production demo account; confirm lume.fit URLs live.
- Row 5 copy: recipients, consent version, 500 vs 403, AI limit copy.
- Sign-offs: target weight required; resend cooldown; Clerk session_exists on device; native Apple sheet vs browser; paywall terms wording.
- Tooling: react-test-renderer deprecation; gesture-handler warning; Prettier; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Parked (other)
- DELETE after session gets 401; stale push tokens never removed; failed POST not retried; sign-out cannot remove token after relaunch.
- Leaving screen not in full non-silent run; meal median across midnight; quiet hours stepper does not wrap; expired session clears reminders until foreground.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go oldest then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- Hardcoded strings: body emoji 26, A$, 'Your data', server limit message, Stepper labels.
- About 68 console errors need scoped spies; two useApi copies; import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- Root config and backend JS unlinted; verify:go lacks -count=1; reanimated shared mock lacks useReducedMotion.
- appleHealth.ts has write types; merge into real provider later.
- HANDOVER says two push token test files; check before editing.

## Decisions (never delete)
- Onboarding: target weight optional server side; resumed Back goes to previous step; training days on backend; Continue never disabled; inches 0-11, feet 3-8; target weight 30-300 kg; calorie floor 1500 (1200 female); 401 ends session.
- Apple sign in: browser oauth_apple flow; hidden on Android.
- Deletion: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Public routes: auth, webhook, subscription, offers, legal, health, consent, deletion, export, feedback, integration revoke, push DELETE. Push POST gated. Retention summary authenticated, counts only.
- AI consent: server gate first; profiles.ai_consent_at; Allow and Not now equal weight; 429 queueable; only ai_daily_limit_reached non-retryable.
- Row 6: hydrateGym limit 200, backend LIMIT kept. 6b: answers stay on device until trial or purchase; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Billing: only src/lib/billing/purchases.ts imports RevenueCat SDK. Trial shown only when store says eligible. 7 day Apple trial gives every feature; no free tier. Billing issue keeps access through grace. REFUND_REVERSED restores state from event expiry. Webhook secret from env only; unset refuses events. No Apple signature check.
- Expired: Subscription, then win back, then paywall. Banner reads server record, past_due only. No price text in Apple messages. WINBACK_REASON in nav.ts.
- Retention: flag default off; message keys only; fixtures until owner access; leaving screen sends no food, body or workout values to analytics.
- Notifications: median meal times after 3 logs per slot; 7 day window; quiet hours 22:00 to 07:00; meal and streak dropped in quiet hours; workout and weekly move to quiet end; promotional needs own opt in; all off by default. Permission only after priming says yes. expo-notifications imported only in permissions.ts and device.ts.
- Push token: secure storage after 204 (STORAGE_KEYS.pushToken, not wiped at sign-out); re-registered once per signed-in user; sign-out deletes saved copy only after DELETE succeeds. Native device token, not Expo token.
- Analytics off by default. English only for new keys. Stepper labels: common.decrease and common.increase.
- Row 11: no denied state for reads; reads return null when not granted or no data.
- Row 12a: account data in PRIVACY_DATA.md and app.json; manifest does not list push token.
- Row 13: APP_STORE_METADATA.md English only; Gemini is default photo AI; crash data not linked to user. Insights go to Gemini by default; Anthropic only when LLM_PROVIDER=claude.
- Row 14: legal copy in en.json (legal.privacy, legal.terms; paywall terms at onboarding.paywall.terms); UPDATED date literal stays (manifest pins it).
- Round 86: 14a parked per override 5; 14b chosen; chip left unwired until Row 31 review.

## Allowed edits
- delete lookupBarcodeAsync and its test line; edit foodDays.test.ts; rename gym.monthSessions and gym.monthFreezes; ROUTE_COVERAGE.md in verify; localeParity ENGLISH_ONLY list.

## Gotchas
- Branch check first. Full Jest paths; never jest -u; use --ci; redirect output.
- Lint: no setState in effect body; use guarded .then.
- Skeleton screens need per-file LoadingSkeleton mock. Typed routes lack /profile/winback and /profile/leaving: use navigate().
- expo-notifications is native: mock in tabs layout tests. Render tests must be *.render.test.tsx.
- Go entitlement tests need LUME_TEST_DATABASE_URL on lume_test_local.
- SafeAreaProvider hides children under Jest without initialMetrics.

## Round log
- Rounds 60 to 80: rows 10, 11, 12a, 13, 14 closed; checkpoints green.
- Round 81-85: features, throttle, promptStore, launch record, chip built (14a step 4 done).
- Round 86: 14a parked; 14b started.