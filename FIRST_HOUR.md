# First hour on the device

Phone in hand. Ordered so the cheapest, most catastrophic failures surface
first — if step 1 fails, nothing after it matters.

**Build the DEBUG-INSTRUMENTED profile, not production.** It carries the
in-app capture system: shake or long-press the floating bubble to file a report
with a screenshot, the route, the last 20 API calls and the console tail
attached. Double-tap the bubble to review them, then export every open one as a
single markdown document and paste it into Claude Code. You should not be
writing notes by hand.

```bash
npx expo prebuild --clean -p ios && eas build --platform ios --profile preview
```

`--profile production` is the clean build with no debug system in it at all —
use that one only when you submit. See RELEASE_PREP.md §E.

The `prebuild --clean` is still the right habit — though the stale `ios/`
tree (Veltai identity, permissions for features the app doesn't have) was
DELETED in the 2026-08-06 audit, so `expo run:ios` can no longer silently
build from it. Prebuild regenerates `ios/` fresh; treat it as disposable.

Set `EXPO_PUBLIC_API_URL` at build time. Without it a release build points at
`http://localhost:8080`, which iOS ATS blocks outright (`NSAllowsArbitraryLoads:
false`).

---

## 1. Does it launch?

**Do:** install, tap the icon, watch the first 3 seconds.

**Working looks like:** a black icon with a white **L**, then a splash showing
the same mark in near-black on white, then either the onboarding hero or the
tabs. Both are placeholders — deliberate, not final art (`assets/README.md`).

The blank-white splash and the Expo-chevron icon are both **fixed**; `npm run
check:assets` exits 0. If you still see a blank splash or a chevron, you built
from the stale `ios/` tree — go back and `prebuild --clean`.

**Most likely failure:** *an infinite spinner on the first screen, no way out.*
That was an unbounded Clerk `getToken()` outside the request deadline — fixed on
this branch (`ca78fbe`), but it is the first thing to suspect if the launch gate
hangs. If it still hangs, the launch gate at `src/app/index.tsx` is awaiting a
GET that never resolves.

**Third failure:** *"Configuration error".* That is correct behaviour, not a
bug — it means `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing and the app is
refusing to treat you as an authenticated dev session. Set the key.

---

## 2. Can I sign up?

**Do:** create an account. Use Sign in with Apple *and* email, in two runs.

**Working looks like:** you land on onboarding, and the account screen later
shows **your** name and email.

**Historical note:** the "Bilal Ahmed / bilal.ahmed@example.com" fabricated
account is long fixed and its regression test lives in
`noFabricatedData.test.ts`. If you ever see it, the world has gone very wrong —
file a report.

**Second failure:** *a 500 on your first write.* Every user table has
`references profiles(id)`, and on `main` that row was created only by the async
Clerk `user.created` webhook — a race you can lose between signing up and
finishing onboarding. The merge brings `auth.EnsureProfile`, which provisions
from the verified JWT. If you still 500, check `CLERK_SECRET_KEY` on the server.

**Also check:** Terms and Privacy from the signup gate. They currently open a
document that says *"This section is being drafted with a legal adviser and is
not final"* — 17 times. Known; blocker #5.

---

## 3. Does the API respond at all?

**Do:** before trusting any screen, confirm the backend is actually reachable.

```bash
curl -sS "$EXPO_PUBLIC_API_URL/health" -i | head -5
```

(`GET /health`, not `/api/health` — `backend/cmd/server/main.go:74`.)

**Working looks like:** `200` and `{"data":{"status":"ok"},"error":null}`.

**Why this matters more than it looks:** when the API is unreachable, the data
layer **swallows the error and reports `error: null`** (`hooks.ts` `useHydration`).
No error state can ever render. On `main` that meant the app quietly showed
fabricated data as yours. On this branch the stores start empty in a release
build, so you get empty screens instead — better, but still silent. **An empty
app is not proof the app is broken; it may be proof the API is unreachable.**
Always check curl before concluding a screen is buggy.

---

## 4. Does a scan complete?

This is the feature the product is built on, and the one I most want you to look
at hard, because two of its defects were invisible to every prior audit.

**Do:** photograph a real meal. Wait. Open the review card. Tap **"Why?"**.

**Working looks like:**

- A band that reads **"High confidence"** / **"Medium"** / **"Low"** — a word,
  not a percentage.
- Behind "Why?", lines that describe *your actual photo*: "plate detected as size
  reference +20", "image is sharp +15", "no plate detected for scale −20",
  "single camera angle −10". These come from the server.

**What it did before this branch:** every real scan rendered **red**. The server
labels a *perfect* single-angle scan "High" at exactly 55; the client demanded
≥85 for green and ≥60 for amber. Green was unreachable. A realistic photo — where
plate detection fails, which is most of them — clamped to **0**, so your first
scan would have read **"0% confidence"** in red. Both fixed in `8511fcb`.

**And behind "Why?" it invented the reasons.** "Food identified +55", "Portion
size estimated +30", "Lighting & framing +15" — synthesised client-side to sum
to the score, printed even when the pipeline identified nothing. The real
factors were in the payload, unread. If you ever see those three strings again,
the fix has regressed; `src/__tests__/scanConfidence.test.ts` should have caught
it.

**Fixed (2026-08-06):** the client poller now waits 130s (above the server's
120s budget) and makes one final status check before declaring failure — so a
slow scan no longer shows "Couldn't analyse this photo" and then appears in
the log anyway, and backgrounding the app through a successful scan no longer
reports a false failure. If you still see fail-then-appear, that's a
regression — file it.

**Second thing to check — this WAS the most damaging bug and is now fixed.**
A confirmed scan used to write two server rows and double its calories on
refresh. `/api/scan/confirm` now claims the pipeline's own row instead of
inserting a second one. **Verify it explicitly:** scan → save → note the day's
calories → pull-to-refresh the Food tab → the number must not change. Five
real-Postgres tests cover this, but none of them has run against your data.

**Fixed (2026-08-06):** discarding a scan now deletes the server row too —
the rejected estimate must NOT reappear on refresh. Also verify: refresh the
food tab WHILE a review card is showing — the card must not duplicate and the
day total must not move until you save.

**Fixed (earlier, verified this audit):** a camera failure shows "Couldn't
take the photo — try again." and stays put. The old path that logged three
invented foods (chicken stir-fry + jasmine rice + cooking oil, 740 kcal) is
dev-only. If you ever see those three items in a TestFlight build, file it as
a blocker.

**If Gemini has no key:** the label scanner returns 503; a Gemini FAILURE
mid-scan now surfaces as a failed scan card (2026-08-06 — it used to write a
fabricated "Unknown food" into your log as a success). With `ANTHROPIC_API_KEY`
unset, Ask-Lume honestly 503s, but the MORNING BRIEF serves a deterministic
template built from your real data — don't mistake that one for working AI.

---

## 5. Does anything survive a restart?

**Do:** log a meal by hand. Force-quit. Reopen.

**Working looks like:** the meal is still there, because the server returned it.

**What to understand:** the zustand stores have **no persistence middleware**.
Nothing survives a restart except what the server returns on hydrate. So this
test is really a test of whether the write reached the server.

**Partly fixed (2026-08-06):** Quick Add and the label-scan save now QUEUE on
a network failure (and say "will sync when you're back online"). Still
bypassing the queue: saved foods, food-log edits/deletes, recipes,
scan-confirm — offline, those are lost at restart. Test Quick Add offline
specifically: it must survive a force-quit and sync on reconnect.

**Also:** a write the server permanently rejects (4xx) leaves the optimistic row
in the UI forever, counted in your totals, with no error shown.

---

## 6. Offline, then back online

**Do:** airplane mode → log two meals → wait → turn it off → **background the
app and foreground it**.

**Working looks like:** "N changes waiting to sync" clears, and nothing
double-writes.

**Why the foreground step:** the queue used to flush **once per app launch**.
There is no NetInfo dependency and no screen ever triggered a flush, so walking
back into coverage did nothing until you force-quit. I added an AppState
`active` flush (`ca78fbe`) — foregrounding is what triggers it.

**Half fixed (2026-08-06):** a permanently-rejected mutation is now dropped
(with a toast) instead of blocking the queue forever. Still true: signing out
destroys every queued write with no warning — sync before you sign out.

---

## 7. The gym tab

**Do:** create a template, add an exercise to it, edit it, delete it.

**Working looks like:** all four succeed.

**What this is testing:** on `main`, adding, editing and deleting a template
exercise returned **500 on every single request** — the SQL selected 22 columns
and scanned 23 destinations. Worse, the POST inserts *before* it reads, so every
retry appended a duplicate row while telling you it failed. Fixed in `d5b6388`
and proven against a real Postgres. If you see "storage error", the fix has
regressed.

**Also check:** the 30-day calendar and "total gym days". On `main` these were
mock and stayed mock even after a successful server hydrate. They should now be
empty on a new account, not showing 47 days.

---

## 8. Account deletion

**Do:** last, on a throwaway account. Profile → Settings → Delete account.

**Working looks like:** the account is gone, you are signed out, and signing in
again with the same identity creates a *new* empty account.

**Unverified:** the cascade is 25 FK `on delete cascade` declarations plus a
`DELETE FROM profiles`. **No test has ever executed a DELETE** — it is asserted
by a regex over SQL text. This is the one destructive path where I would most
want a real run before you trust it. `oauth_states` and `rate_limit_counters`
keep your Clerk id (no FK).

---

## If something looks wrong, check this first

1. **Did you `expo prebuild --clean`?** If iOS asks for Apple Health or the
   microphone, you built from the stale tree.
2. **Is `EXPO_PUBLIC_API_URL` set?** Empty screens usually mean an unreachable
   API, not a broken screen — the data layer reports `error: null` on failure.
3. **Do the server logs show a missing key?** `ANTHROPIC_API_KEY` unset makes
   the morning brief fall back to a deterministic template (Ask-Lume 503s);
   `GEMINI_API_KEY` unset makes every scan route 503.

---

## When something IS wrong: file it, don't write it down

Long-press the bubble, type one line, hit Save. That is the whole interaction —
the screenshot, route, API trace, console tail, auth/entitlement state and the
store slice are attached automatically. Shake if your hands are busy; it files a
draft with no sheet at all. Crashes, unhandled rejections and API 5xxs file
themselves.

At the end of a session: double-tap the bubble → **Export markdown** → share it
to yourself → paste the whole file into Claude Code. It is laid out for exactly
that, blockers first, with each report's evidence fenced.

Credentials are redacted before anything touches disk, so the export is safe to
paste. Screenshots are not — they are your own screen, so treat the file as
personal data.
