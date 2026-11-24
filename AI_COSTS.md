# AI costs (estimates)

All figures here are **estimates**, not measurements. They come from prompt
sizes measured on the test fixtures, scaled up to a full 30 day user, at about
4 characters per token. Check them against the Google AI Studio usage page once
real traffic exists.

## Model and prices

Insights, the morning brief and Ask Lume (natural language query) use Gemini by
default (`LLM_PROVIDER=gemini`). The model is `GEMINI_MODEL`, default
**`gemini-3.5-flash-lite`**.

Prices read on 24 Nov 2026 from Google's own pages: the Gemini API pricing page
(ai.google.dev/gemini-api/docs/pricing, now served at aistudio.google.com/docs/pricing),
the models page and the deprecations page. Paid tier, Standard, USD per 1
million tokens:

| Model | Input (text) | Output (thinking included) | Status |
| --- | --- | --- | --- |
| `gemini-3.5-flash-lite` (default) | $0.30 | $2.50 | Stable, no shutdown date announced |
| `gemini-3.1-flash-lite` | $0.25 | $1.50 | Stable, shutdown 7 May 2027 (earliest date) |
| `gemini-2.5-flash-lite` | $0.10 | $0.40 | Only for accounts that used 2.5 models before |
| `gemini-3.8-flash` | $0.75 | $3.75 | Rises to $1.50 / $7.50 on 1 Jan 2027 |

Why the default: 3.5 Flash-Lite is the cheapest Flash class model that a new
Google account can use and that has no announced shutdown. 3.1 Flash-Lite costs
less per token but would need a model change about five months after launch.
Switching is one environment variable (`GEMINI_MODEL=gemini-3.1-flash-lite`).
Its default thinking level is "minimal", so thinking tokens stay small.

The optional Claude fallback (`LLM_PROVIDER=claude`) is not costed here.

## Per call

| Call | Input tokens | Output tokens | Estimated cost |
| --- | --- | --- | --- |
| Insights (one generation of 3 to 5 insights) | about 1,500 | about 500 | about $0.0017 |
| Morning brief | about 300 | about 200 | about $0.0006 |
| Ask Lume query | about 1,600 | about 350 | about $0.0014 |

Input is the system prompt plus the user's data summary (and the question for
Ask Lume). Output includes a small thinking allowance. `maxOutputTokens` is
capped at 1,024, so no call can cost more than about $0.003 in output.

## What stops paying twice

- Insights regenerate at most once every 6 hours per user (insight age gate).
- The morning brief is generated once per user per calendar day.
- The same user sending the same input within `LUME_AI_CACHE_SECONDS`
  (default 900) gets the cached answer with no paid call.
- `LUME_AI_DAILY_LIMIT` (default 40) caps paid calls per user per day. Over it,
  the brief and insights use the plain text fallback and Ask Lume answers 429.
- Failed calls are not cached and do not use the allowance.

## Monthly estimate

Typical active user: 1 insight generation a day, 1 brief a day, 3 questions a
week (about 13 a month).

30 x $0.0017 + 30 x $0.0006 + 13 x $0.0014 = **about $0.09 per user per month**.

Heavy user: 4 insight generations a day, 1 brief, 2 questions a day:
120 x $0.0017 + 30 x $0.0006 + 60 x $0.0014 = **about $0.31 per user per month**.

| Active users | Typical | Heavy |
| --- | --- | --- |
| 100 | about $9 a month | about $31 a month |
| 1,000 | about $90 a month | about $310 a month |

Worst case for one user who hits the daily limit every day at the insight
price: 40 x 30 x $0.0017 = about $2.04 a month.

Photo and label scans also use Gemini (`gemini-2.5-flash` in
`backend/internal/scan`) and are not included above.
