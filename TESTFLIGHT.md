# Lume → TestFlight, test-mode configuration

The deliberate posture: **Clerk test instance · RevenueCat sandbox · real
Gemini/Anthropic keys with billing caps · live Supabase · debug capture ON.**

Every store/platform fact below was verified against live documentation on
2026-08-09, with the source named. Nothing here is from memory — a previous
audit of this repo missed two guideline changes that way.

---

## 0. The one thing that was blocking you

The `preview` profile is `distribution: "internal"`. **It could never have been
uploaded to TestFlight.** Apple only accepts App Store-signed builds, and
internal distribution produces an ad-hoc or enterprise-signed `.ipa` (also
capped at 100 device UDIDs per year).

> "TestFlight only accepts builds with `"distribution": "store"` set in
> eas.json" — [docs.expo.dev/submit/testflight](https://docs.expo.dev/submit/testflight/)

Use the new **`testflight`** profile. It is store distribution *and* keeps
debug capture on, which is allowed: `env` has no distribution restriction.

---

## 1. Before anything: preflight

```bash
npm run preflight
```

Checks required variables, the API URL (https, not localhost), the Clerk
**test** instance, the RevenueCat key shape, the eas.json profiles, that every
migration is applied, that `debug_reports` exists **with RLS**, that Clerk is
reachable, and that the backend reports a git SHA **matching this checkout**
and was built from a clean tree.

Non-zero exit on any failure. A check that cannot run prints `skip` and says so
loudly — a skip has verified nothing.

---

## 2. Deploy the backend first

The app is useless against a stale or absent API.

```bash
cd backend && go build -o lume-server ./cmd/server     # never run a scratchpad binary
DATABASE_URL="<supabase pooler url>" ./deploy/migrate.sh status
DATABASE_URL="<supabase pooler url>" ./deploy/migrate.sh verify
curl -s https://<your-api>/health | jq
```

> **The migrations are already applied (2026-08-09).** All 15 are on the live
> project `qknwxgaehhclvpeadmdh`, including `20260806000001_debug_reports`,
> which had **never** existed in production before that date. `status` should
> report `0 pending` and `verify` should say the database matches the
> migrations on disk. If either disagrees, stop — something changed the
> database outside this runner.
>
> The live database had no `schema_migrations` table at all until then, so
> `migrate.sh` could not tell what was applied. It is now baselined with the
> real checksums for all 15, which is what makes `verify` meaningful.
>
> **The shared libraries are still empty.** `exercise_library` and
> `cuisine_food_library` are seeded by the backend on startup
> (`cmd/server/main.go`), and that seeding could not succeed before the
> migrations landed — it writes `met_value` and `parameter_schema`, columns
> that did not exist. Both are non-fatal and only logged, so watch the first
> boot for `exercise seed:` / `cuisine seed:` lines and then confirm the tables
> are populated. Gym templates and cuisine suggestions are empty until they are.

`/health` must return a `revision` equal to `git rev-parse HEAD` and
`"dirty": false`. If `revision` is absent, you are running a binary from before
the build-identity change — the exact `lumoserver` failure.

**Backend environment** (server-side secrets, never in the app):

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Supabase pooler URL, `sslmode=require` |
| `CLERK_SECRET_KEY` | yes | **test** instance secret (`sk_test_…`) |
| `CLERK_WEBHOOK_SECRET` | yes | else the user webhook 503s |
| `CLERK_ISSUER` | prod | pins the token issuer |
| `LUME_BASE_URL` | yes | public https origin of the API |
| `GEMINI_API_KEY` | yes | **set a billing cap** |
| `ANTHROPIC_API_KEY` | yes | **set a billing cap** |
| `REVENUECAT_WEBHOOK_AUTH` | yes | matches the RC dashboard |
| `INTEGRATION_ENCRYPTION_KEY` | optional | Strava/WHOOP only |

---

## 3. EAS environment variables

**Cloud builds do not read your local `.env`.** Set these on EAS. `EXPO_PUBLIC_*`
values are **inlined into the JS bundle and are therefore public** — that is
correct for all three below (a Clerk publishable key and a RevenueCat *public
SDK* key are designed to ship in clients). Nothing secret belongs here.

**Put them in the `preview` environment**, not `production` — see the box below.

```bash
eas env:set --environment preview --name EXPO_PUBLIC_API_URL               --value "https://api.lume.fit" --visibility plaintext
eas env:set --environment preview --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_test_…"            --visibility plaintext
eas env:set --environment preview --name EXPO_PUBLIC_REVENUECAT_IOS_KEY    --value "appl_…"               --visibility plaintext
```

`eas env:create` is deprecated — eas-cli v21.7.0 says so itself: *"create an
environment variable for the current project or account (deprecated, use eas
env:set)"*. `eas secret:*` still exists and is **not** labelled deprecated by
the CLI, but it predates environments and has **no `--environment` flag**
(`--scope`, `--name`, `--value`, `--type`, `--force`, `--non-interactive`
only), so it cannot target `preview` and is the wrong tool here regardless.
`eas env:set` is the command. (Checked against the installed CLI on
2026-08-09, not from memory.)

> **Which EAS environment a build uses — the trap this nearly walked into.**
> `eas build` has **no `--environment` flag**. The environment comes solely
> from the profile's `environment` field, and if you omit it eas-cli *infers*
> one: a **store-distribution profile silently resolves to `production`**.
> A test-mode TestFlight build would then have pulled live Clerk and
> RevenueCat values. Every profile in `eas.json` now sets `environment`
> explicitly; `testflight` is pinned to **`preview`**.
> (Verified against eas-cli v21.7.0 `evaluateConfigWithEnvVarsAsync`.)

`EXPO_PUBLIC_DEBUG_CAPTURE=1` comes from the profile's own `env` block. That is
also the higher-precedence source: **eas.json profile `env` overrides an EAS
server variable of the same name** (documented under
[EAS Workflows → environment → Precedence](https://docs.expo.dev/eas/workflows/environment/#precedence)).
So do not also store it as a server variable — in the `production` environment
it would apply to the production build, whose profile `env` is deliberately
empty.

A build missing any of these **fails in the EAS log** before compiling
(`scripts/assert-build-env.mjs`, wired to `eas-build-pre-install`). If one ever
slips through, the app refuses to start and names it on screen.

---

## 4. Build and submit

```bash
npm run preflight                                   # must exit 0
npx expo prebuild --clean -p ios                    # ios/ is gitignored by design
eas build --platform ios --profile testflight
eas submit --platform ios --profile testflight --latest
```

Fill the `submit.testflight.ios` placeholders in `eas.json` first:
`appleTeamId`, `ascAppId`, `ascApiKeyId`, `ascApiKeyIssuerId`, and a path to
the App Store Connect `.p8` key **kept outside the repo** (`*.p8` is
gitignored).

`autoIncrement: true` bumps `ios.buildNumber` each build, so you never collide
with an existing TestFlight build.

Note: a standalone `eas submit` does **not** load EAS environment variables —
anything it needs must come from your local shell or the `eas.json` submit
profile. All three ASC API key fields must be present together, or
`--non-interactive` fails with *"ascApiKeyPath, ascApiKeyIssuerId and
ascApiKeyId must all be defined in eas.json"*. If `EXPO_APPLE_APP_SPECIFIC_PASSWORD`
is set in your shell it takes precedence and the API key is ignored entirely.

Build image is pinned to `macos-tahoe-26.4-xcode-26.4` (iOS 26.4 SDK), above
Apple's current floor. It is pinned deliberately: the `auto` alias has been
repointed under SDK users mid-cycle before.

---

## 5. App Store Connect

**Internal testing does NOT require Beta App Review.** Apple's "add internal
testers" flow goes create group → invite → add build → *What to Test* → done,
with no review step between. **External testing DOES** require it for the first
build of each version. So: use an internal group (up to 100 App Store Connect
users, on up to 30 devices each) and you can install within minutes of upload.

Still required either way:

1. **Export compliance** — already declared in `app.json`
   (`ITSAppUsesNonExemptEncryption: false`), so builds should not stall on the
   manual question. The value is correct: Apple's own reference says to use
   `NO` when the app "including any third-party libraries it links against"
   uses only exempt encryption, and names OS-provided HTTPS via URLSession as
   exempt. Lume implements no cryptography of its own.
   **Still check the first upload:** two Apple Developer Forums threads from
   Oct 2025 report being asked anyway (both community-only, no Apple reply, so
   treat as folklore rather than rule). Open the build in App Store Connect and
   confirm it is not marked **"Missing Compliance"** before inviting testers.
2. **Age rating questionnaire** — mandatory since the 2026 tier change.
3. **Regulated Medical Device Status** — required for Health & Fitness apps
   distributed in EEA/UK/US since 26 Mar 2026. Lume computes nutrition targets
   and is not a medical device; answer accordingly, but the declaration must be
   made.
4. **Beta App Description and test information** for the TestFlight page.

---

## 6. Test-mode sign-in (no real inbox needed)

Clerk **test mode** accepts any email using the `+clerk_test` subaddress and a
fixed code:

- Email: `anything+clerk_test@example.com`
- **Verification code: `424242`**
- Test phone numbers: `+1 (XXX) 555-0100`–`0199`, same code.

No email is actually sent. The Clerk allowlist/redirect scheme must be **`lume`**
(app.json `scheme`), matching `APP_SCHEME`. It is `lume` — verified; no
`veltai://` remains anywhere in config.

---

## 7. RevenueCat sandbox

- A TestFlight build **always uses the StoreKit sandbox** — purchases are free.
- Dashboard must have: entitlement identifier exactly **`pro`**, a product, and
  a **default Offering with a paywall designed** — if no offering/paywall
  exists, "See plans" now says *"Plans could not be loaded"* instead of doing
  nothing silently (it used to do nothing at all).
- Trial length must match `TRIAL_DAYS = 7` in `src/lib/billing/purchases.ts` —
  one constant, so the dashboard has one number to match.
- **Renewals are accelerated.** Signed in as a *sandbox* tester the default is
  5-minute renewals (1 month → 5 min; 1 year → 1 hour), auto-cancelling after
  12 renewals. In TestFlight with a *production* Apple Account, every
  subscription renews once per 24 h regardless of real duration, max 6.
  Nothing in the entitlement logic assumes real-world durations: `isActive`
  compares the actual `expires_at` timestamp, so accelerated expiry just works.
- Enable **"View Sandbox Data"** in the RevenueCat dashboard or your test
  purchases will appear to have vanished.
- Sandbox is slow — a purchase can take 15+ seconds. There is deliberately no
  client-side purchase timeout.
- Prices and product names are frequently wrong in sandbox. Verify the *flow*,
  not the strings.

---

## 8. First ten minutes on the device

Do these in order. The first four are the debug system — **it has never run
once**, and everything afterwards depends on it working.

1. **Launch.** No "Configuration error" screen. If you see one, it names the
   missing variable — fix and rebuild.
2. **Shake the device.** A report should file silently (no sheet). This is the
   gesture most likely to need tuning.
3. **Long-press the floating bubble** → quick sheet. **Double-tap** → report
   list. **Drag** it → repositions and snaps to an edge.
4. **Sync a report** from the debug screen. It must say how many synced. If
   `debug_reports` is missing you now get a specific message naming
   `migrate.sh` — previously this failed silently and the fortnight's reports
   would have been device-only.
5. **Check a report's contents:** a screenshot, your real Clerk user id, and a
   **non-null git SHA** (it was always null before app.config.js stamped it).
6. **Export markdown** → share sheet → paste into Claude Code.
7. Sign in with `you+clerk_test@example.com` / `424242`.
8. Complete onboarding. Age, sex, height and weight are all required now; the
   Continue button explains what is missing rather than sitting inert.
9. Paywall → "See plans". Confirm the RevenueCat sheet renders. Cancel it, and
   confirm onboarding still completes on the free tier.
10. Scan a real meal. Confirm the day's calories do **not** change on
    pull-to-refresh.

---

## 9. Draft TestFlight tester notes (2.3.1 disclosure)

> **Lume beta — what to test**
>
> This build includes a **built-in bug reporting tool** for beta testing.
> Shaking your device, or long-pressing the floating bubble, files a report
> that captures a **screenshot of the current screen**, the route you were on,
> recent console output, your last API calls, and app state. Reports are stored
> on your device and synced to our server so we can diagnose issues.
> Credentials and tokens are stripped before anything is written.
>
> Because reports contain screenshots of your own screen, treat them as
> personal data. This tool exists **only in beta builds** and is not present in
> the App Store version.
>
> Please try: signing up, completing setup, logging a meal by photo, barcode
> and label, logging a gym session, and the subscription flow (purchases are
> free in TestFlight sandbox).

---

## What only Isa can do — ordered

1. **Deploy the backend** with the environment table in §2, then confirm
   `/health` shows a `revision` matching `git rev-parse HEAD` and `dirty: false`.
2. ~~Apply the migrations~~ — **done 2026-08-09.** All 15 are applied to the
   live project and `debug_reports` exists with its RLS policy. Confirm with
   `DATABASE_URL=… ./deploy/migrate.sh verify` (expects "Database matches the
   migrations on disk"), and check the first backend boot actually seeded
   `exercise_library` and `cuisine_food_library` — see §2.
3. **Set billing caps** on the Gemini and Anthropic accounts — there is still
   no global spend ceiling in code.
4. **Clerk test instance**: copy `pk_test_…` and `sk_test_…`; add **`lume`** to
   the allowed redirect schemes; enable Apple and Google SSO and email-code.
5. **RevenueCat**: entitlement id **`pro`**, one product, a **default Offering
   with a designed paywall**, **7-day** trial, and the webhook auth value
   matching `REVENUECAT_WEBHOOK_AUTH`.
6. **App Store Connect**: create the app record for `fit.lume.app`, create an
   App Store Connect **API key** (.p8) and fill the `eas.json` submit
   placeholders, add **sandbox testers**, complete the **age rating
   questionnaire** and the **Regulated Medical Device Status** declaration.
7. **Create an internal TestFlight group** and add yourself — no Beta App
   Review needed.
8. `eas env:set` the three `EXPO_PUBLIC_*` values from §3 into the **`preview`**
   environment — the exact commands are in `docs/ENV_SHEET.md`.
9. `npm run preflight`, then build and submit (§4).
10. Work §8 on the device, in order.

## Cannot be verified without keys or a device

- Every Clerk flow (SSO, email OTP), every RevenueCat purchase/restore, and the
  real Gemini/Anthropic calls — no keys exist in this environment.
- Shake, bubble drag, screenshot capture and the share sheet — device-only.
- Whether the RevenueCat hosted paywall renders at all; the code path that
  reports its failure is now correct, but the success path is untested.
- The accelerated duration of a **free trial** specifically: Apple documents
  acceleration for subscription periods but not for introductory offers.
  Measure it on device and record what you observe.
