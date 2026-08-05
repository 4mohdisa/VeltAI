# First hour on the device

Phone in hand. Ordered so the cheapest, most catastrophic failures surface
first — if step 1 fails, nothing after it matters.

**Before you build anything:**

```bash
npx expo prebuild --clean -p ios
```

Your local `ios/` tree is stale, gitignored, predates RevenueCat, and declares
Apple Health / Face ID / microphone / photo-library permissions the app does not
use. `expo run:ios` skips prebuild when that directory exists, so without
`--clean` you ship all of them. Treat `ios/` as disposable.

Set `EXPO_PUBLIC_API_URL` at build time. Without it a release build points at
`http://localhost:8080`, which iOS ATS blocks outright (`NSAllowsArbitraryLoads:
false`).

---

## 1. Does it launch?

**Do:** install, tap the icon, watch the first 3 seconds.

**Working looks like:** an icon that isn't Expo's chevron, then a splash with a
**visible** mark, then either the onboarding hero or the tabs.

**Most likely failure:** *a blank white screen for the whole splash.*
`splash-icon.png` is a pure-white mark on a `#FFFFFF` background — every visible
pixel is `rgb(255,255,255)`. **Fix:** use a mark that contrasts, or change
`backgroundColor` in `app.json:24-30`. This is expected; it is blocker #2.

**Second failure:** *an infinite spinner on the first screen, no way out.*
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

**Most likely failure:** *it shows "Bilal Ahmed / bilal.ahmed@example.com".*
If you see that, **you are not on this branch** — that is the unmerged
fabricated-data defect, still live on `main`. Stop and check your branch.

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

**Most likely failure now:** *"Couldn't analyse this photo", and then the meal
appears in your log a minute later anyway.* The client poller gives up at 60s
while the server is allowed 120s. **Not fixed.** On a slow connection or a busy
backend this is likely.

**Second failure:** *the scan you saved is counted twice.*
`POST /api/scan/pipeline` creates a `food_logs` row and `POST /api/scan/confirm`
inserts a **second** one; nothing reconciles them and the list call sends no
status filter. **Not fixed — this is the most damaging open bug.** Test it
explicitly: scan → save → pull-to-refresh the Food tab → check whether the meal
and its calories appear twice.

**Third failure:** *you discard a scan and it comes back.* Discarding does not
delete the server row, so the estimate you rejected reappears on the next
refresh, counted as eaten. **Not fixed.**

**Fourth failure:** *the camera fails and three foods you never ate appear* —
chicken stir-fry, jasmine rice, cooking oil, 740 kcal, with a "Scanning your
meal…" toast. **Not fixed.** If you see those three items, that is what
happened.

**If Gemini has no key:** the label scanner returns 503. Note that with
`ANTHROPIC_API_KEY` unset the AI features return **plausible canned text as if
it were AI output** — do not mistake that for working AI.

---

## 5. Does anything survive a restart?

**Do:** log a meal by hand. Force-quit. Reopen.

**Working looks like:** the meal is still there, because the server returned it.

**What to understand:** the zustand stores have **no persistence middleware**.
Nothing survives a restart except what the server returns on hydrate. So this
test is really a test of whether the write reached the server.

**Most likely failure:** *the meal is gone.* Several writes bypass the offline
queue entirely — saved foods, food-log edits and deletes, quick-add, recipes,
scan-confirm. Offline, they are lost at restart with no warning. **Not fixed.**

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

**Still broken:** signing out destroys every queued write with no warning, and
one permanently-failing mutation at the head blocks the queue forever (no
max-retry, no poison path).

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

1. **Are you on `audit/testflight-gate`?** `main` still has all twelve
   fabricated-data defects. Seeing "Bilal Ahmed" or a 13-day streak means you
   are on the wrong branch.
2. **Did you `expo prebuild --clean`?** If iOS asks for Apple Health or the
   microphone, you built from the stale tree.
3. **Is `EXPO_PUBLIC_API_URL` set?** Empty screens usually mean an unreachable
   API, not a broken screen — the data layer reports `error: null` on failure.
4. **Do the server logs show a missing key?** `ANTHROPIC_API_KEY` unset makes AI
   features return canned text rather than failing.
