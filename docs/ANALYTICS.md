# Analytics

First-party only. One table, one endpoint, no SDK, no dashboard, no third party.
Paste these into the Supabase SQL editor (Dashboard → SQL Editor).

Every query here was executed against the live database on 2026-08-09. They
return zero rows today because no build has reported yet — that is the expected
answer, not a broken query.

---

## What exists

| Piece | Where |
|---|---|
| Ingest | `POST /api/analytics/events` — `backend/internal/analytics/analytics.go` |
| Storage | `public.analytics_events` — `supabase/migrations/20260727000001_analytics_events.sql` |
| Client | `src/lib/analytics.ts` |
| Consent | `src/lib/ai/consent.ts` (the ask), `src/app/profile/privacy.tsx` (the toggle) |

Columns: `id`, `user_id`, `event_name`, `properties jsonb`, `session_id`,
`client_ts`, `server_ts`.

`user_id` is always taken from the verified Clerk JWT, never from the request
body. Events outside the allow-list are rejected with a 400 by the server and
dropped by the client before that.

### Consent

**Opt-in.** `analyticsEnabled` defaults to false; nothing is collected until the
user accepts the one-time disclosure that also covers AI processing. Declining
leaves it off, accepting can be undone in Settings → Privacy independently of
the AI permission, and sign-out clears the grant so the next account is asked
again. See `DECISIONS.md`, "Live database, and analytics consent (2026-08-09)".

### What is never in a payload

No food names, quantities, weights, notes, emails or free text. `sanitize()` in
`src/lib/analytics.ts` enforces this at runtime: a value must be a short scalar
tag, so anything containing a space or an `@` is dropped, and the debug system's
credential patterns are applied to what survives. The type signature alone is
not the guarantee — TypeScript is erased before anything ships.

### Every event carries the build

`app_version`, `build`, and `git_sha` (when the build knows it) are stamped onto
every event, so any query below can be filtered per release:

```sql
where properties->>'app_version' = '1.0.0'
```

### Offline queue

Analytics deliberately does **not** route through `src/lib/offline/queue.ts`. The
queue replays one mutation per POST while analytics needs batches of 50; it
toasts the user when it discards (which would be a lie about their data); it
blocks head-of-line, so a stuck analytics batch would stall real meals and
workouts; it re-throws permanent 4xx into callers that must never throw; and it
has no purge-by-kind, so an opt-out could not clear analytics without destroying
pending user writes. Analytics keeps its own persisted buffer and is flushed
immediately after the queue, from the same place, on launch and on foreground.

---

## Events

| Event | Properties | Fired from |
|---|---|---|
| `session_started` | — | `src/app/_layout.tsx`, after consent is rehydrated |
| `onboarding_step_viewed` | `step`, `index` | `src/components/onboarding/OnbScaffold.tsx` |
| `onboarding_completed` | — | `src/app/onboarding/paywall.tsx` |
| `food_logged` | `method` | `src/lib/data/mutations.ts` |
| `scan_started` | `entry` | `src/lib/data/scan.ts`, `src/app/food/label-scan.tsx` |
| `scan_completed` | `entry` | `src/lib/data/scan.ts`, `src/app/food/label-scan.tsx` |
| `scan_failed` | `entry`, `reason` | `src/lib/data/scan.ts`, `src/app/food/label-scan.tsx` |
| `scan_confirmed` | `entry` | `src/lib/data/scan.ts` |
| `scan_corrected` | `entry` | `src/lib/data/scan.ts` |
| `scan_discarded` | `entry` | `src/lib/data/scan.ts` |
| `workout_logged` | — | `src/lib/data/mutations.ts`, `src/app/gym/session.tsx` |
| `template_created` | — | `src/app/gym/new-template.tsx` |
| `integration_connected` | `provider` | `src/app/profile/integrations.tsx` |
| `paywall_viewed` | — | `src/app/onboarding/paywall.tsx` |
| `purchase_started` | — | `src/lib/billing/purchases.ts` |
| `purchase_completed` | — | `src/lib/billing/purchases.ts` |
| `purchase_cancelled` | — | `src/lib/billing/purchases.ts` |
| `purchase_restored` | — | `src/lib/billing/purchases.ts` |
| `trial_started` | — | not currently fired |
| `feature_used` | `name` | gym logging, recipes, saved meals, AI brain, morning brief |

`entry` is one of `camera`, `barcode`, `label`. Quick add is not a scan and
reports as `food_logged` with `method` instead — counting it as a scan would
make the success rate below meaningless.

`onboarding_step_viewed` fires on ENTRY to a step. Completion of step N is entry
to step N+1, which is what the funnel query below computes; naming it
`…_completed` and firing it on entry would have been a lie in the data.

---

## Feature usage counts

Which features anyone actually opens, last 14 days.

```sql
select
  coalesce(properties->>'name', event_name) as feature,
  count(*)                                  as events,
  count(distinct user_id)                   as users
from analytics_events
where server_ts > now() - interval '14 days'
  and (event_name = 'feature_used'
       or event_name in ('food_logged','workout_logged','template_created',
                         'scan_started','integration_connected'))
group by 1
order by users desc, events desc;
```

Raw event volume, everything, so a missing event name is visible:

```sql
select event_name, count(*) as events, count(distinct user_id) as users,
       max(server_ts) as last_seen
from analytics_events
group by 1
order by events desc;
```

---

## Onboarding funnel, with drop-off per step

Ordered by the step index the app sends, so adding a step does not reorder this.

```sql
with steps as (
  select
    properties->>'step'                as step,
    (properties->>'index')::int        as idx,
    count(distinct user_id)            as users
  from analytics_events
  where event_name = 'onboarding_step_viewed'
    and properties->>'index' is not null
  group by 1, 2
)
select
  idx,
  step,
  users,
  lag(users) over (order by idx)                                as prev_users,
  lag(users) over (order by idx) - users                        as dropped_here,
  round(100.0 * users / nullif(first_value(users) over (order by idx), 0), 1)
                                                                as pct_of_start
from steps
order by idx;
```

Completed the whole flow:

```sql
select
  count(distinct user_id) filter (where event_name = 'onboarding_step_viewed') as started,
  count(distinct user_id) filter (where event_name = 'onboarding_completed')   as completed;
```

Where users who never finished stopped — the last step each one reached:

```sql
select last_step, count(*) as users from (
  select distinct on (user_id)
    user_id,
    properties->>'step' as last_step
  from analytics_events
  where event_name = 'onboarding_step_viewed'
    and user_id not in (
      select user_id from analytics_events where event_name = 'onboarding_completed'
    )
  order by user_id, (properties->>'index')::int desc
) t
group by 1
order by users desc;
```

---

## Scan success rate by entry point

```sql
select
  properties->>'entry' as entry,
  count(*) filter (where event_name = 'scan_started')   as started,
  count(*) filter (where event_name = 'scan_completed') as completed,
  count(*) filter (where event_name = 'scan_failed')    as failed,
  count(*) filter (where event_name = 'scan_confirmed') as confirmed,
  count(*) filter (where event_name = 'scan_discarded') as discarded,
  round(100.0 * count(*) filter (where event_name = 'scan_completed')
        / nullif(count(*) filter (where event_name = 'scan_started'), 0), 1) as pct_completed,
  round(100.0 * count(*) filter (where event_name = 'scan_confirmed')
        / nullif(count(*) filter (where event_name = 'scan_completed'), 0), 1) as pct_kept
from analytics_events
where event_name like 'scan_%'
group by 1
order by started desc;
```

Why scans fail, by entry point:

```sql
select
  properties->>'entry'  as entry,
  properties->>'reason' as reason,
  count(*)              as failures
from analytics_events
where event_name = 'scan_failed'
group by 1, 2
order by failures desc;
```

`pct_kept` is the honest quality signal: a scan that completes and is then
discarded produced a number the user did not believe.

---

## Paywall conversion

```sql
select
  count(distinct user_id) filter (where event_name = 'paywall_viewed')      as viewed,
  count(distinct user_id) filter (where event_name = 'purchase_started')    as started,
  count(distinct user_id) filter (where event_name = 'purchase_completed')  as completed,
  count(distinct user_id) filter (where event_name = 'purchase_cancelled')  as cancelled,
  count(distinct user_id) filter (where event_name = 'purchase_restored')   as restored,
  round(100.0 * count(distinct user_id) filter (where event_name = 'purchase_completed')
        / nullif(count(distinct user_id) filter (where event_name = 'paywall_viewed'), 0), 1)
                                                                            as pct_view_to_buy
from analytics_events;
```

This is a product funnel, not revenue. Entitlement truth is `subscriptions`,
written by the RevenueCat webhook — never reconcile money from this table.

---

## Error frequency

Scan failures per day, the only failure class the app reports as an event:

```sql
select
  date_trunc('day', server_ts)::date as day,
  properties->>'reason'              as reason,
  count(*)                           as failures,
  count(distinct user_id)            as users
from analytics_events
where event_name = 'scan_failed'
  and server_ts > now() - interval '30 days'
group by 1, 2
order by day desc, failures desc;
```

Failure rate against volume, per build — this is the one to watch during
TestFlight:

```sql
select
  properties->>'app_version' as app_version,
  properties->>'git_sha'     as git_sha,
  count(*) filter (where event_name = 'scan_failed')  as failures,
  count(*) filter (where event_name = 'scan_started') as attempts,
  round(100.0 * count(*) filter (where event_name = 'scan_failed')
        / nullif(count(*) filter (where event_name = 'scan_started'), 0), 1) as pct_failed
from analytics_events
where event_name in ('scan_started', 'scan_failed')
group by 1, 2
order by attempts desc;
```

Analytics only sees failures the app chose to report. Crashes, API 5xx and
network errors are **not** here — those go to `debug_reports` via the in-app
capture system. Cross-reference:

```sql
select date_trunc('day', captured_at)::date as day, severity, area, count(*)
from debug_reports
group by 1, 2, 3
order by day desc, count desc;
```

---

## Sanity checks

Is anything arriving at all, and from which build:

```sql
select
  properties->>'app_version' as app_version,
  properties->>'build'       as build,
  count(*)                   as events,
  count(distinct user_id)    as users,
  count(distinct session_id) as sessions,
  min(server_ts)             as first_seen,
  max(server_ts)             as last_seen
from analytics_events
group by 1, 2
order by last_seen desc;
```

Client clock skew — `client_ts` is client-supplied and deliberately unbounded
server-side, so a device with a wrong clock is visible rather than silently
distorting a time series:

```sql
select
  count(*) filter (where client_ts > server_ts + interval '1 hour')  as future_skew,
  count(*) filter (where client_ts < server_ts - interval '1 day')   as past_skew,
  count(*)                                                           as total
from analytics_events;
```

Guard against a property that should never appear — this should always return
zero, and a non-zero result means `sanitize()` has been bypassed:

```sql
select id, event_name, properties
from analytics_events
where properties::text ~ '[@]'
   or properties::text ~ '"[^"]* [^"]*"'
limit 50;
```

The second pattern matches any property value containing a space, which the
client-side allow-list forbids.
