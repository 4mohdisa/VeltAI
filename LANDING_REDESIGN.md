# Lumo marketing site — redesign

Branch `web/landing-redesign`, off `main`, not merged. 2026-08-02.

Two jobs: bring the site's design tokens into parity with the app, then rebuild
the landing page. Both are done. But the most important outcome was neither:
**the site as it stood contained seven claims the app does not support**, and
the single most prominent visual on the homepage — `585±65 kcal` — advertised a
feature that does not exist in any form. Section 6 is the list.

---

## 1. Job 1 — token parity

`web/app/tokens.css` now mirrors `src/lib/design/tokens.ts`. Every colour,
radius, spacing step, duration and easing curve is byte-identical. One source of
truth per value, referenced by name.

### Colour — exact, no exceptions

| Web token | App token | Value |
|---|---|---|
| `--paper` | `color.white` | `#FFFFFF` |
| `--surface` | `color.light1` | `#F2F2F7` |
| `--line` | `color.light2` | `#E5E5EA` |
| `--line-strong` | `color.light3` | `#D1D1D6` |
| `--zone` | `color.gray50` | `#FAFAFA` |
| `--ink` | `color.gray800` / `label` | `#171717` |
| `--ink-strong` | `color.gray1` | `#1C1C1E` |
| `--ink-secondary` | `color.secondary` / `gray500` | `#6B6B6B` |
| `--ink-tertiary` | `color.gray400` / `tertiaryLabel` | `#8A8A8A` |
| `--primary` | `color.primary` | `#000000` |
| `--on-primary` | `color.onPrimary` | `#FFFFFF` |
| `--accent-orange` … `--accent-ocean` | `accent.*` (all 8) | unchanged |
| `--data-protein` … `--data-positive` | `categoryAccent.*` (all 8) | unchanged |

**One value changed, and it was a correction, not a divergence.** The old site
defined `--zone: #f6f5f2`, a warm grey it described as "the site-only warmth".
The app has no such colour. Under the rule that the site may not introduce a new
colour language, it is now `#FAFAFA` — the app's `color.gray50`.

Radii (`sm 10 / md 16 / lg 20 / xl 28 / 2xl 36 / pill 999`), spacing
(`xs 4 … 5xl 64`), motion durations (`180/260/380/700/1100`) and the three
easing curves are carried across unchanged. Shadows map React Native's
`shadowOffset.height` → CSS y-offset and `shadowRadius` → blur, opacity
unchanged.

### Type — the app's actual typeface, and no webfont at all

The previous build loaded **Hanken Grotesk** and **IBM Plex Mono** from Google
Fonts. Neither exists in the app. Both are gone:

| Role | Stack | Resolves to on Apple |
|---|---|---|
| `--font-system` | `-apple-system, BlinkMacSystemFont, 'SF Pro Text'…` | **SF Pro** — the app's typeface |
| `--font-rounded` | `ui-rounded, 'SF Pro Rounded'…` | **SF Pro Rounded** — the app's numeral face |
| `--font-mono` | `ui-monospace, 'SF Mono'…` | **SF Mono** — a system face, not an import |

This is better on three axes at once, which is rare: exact type parity on the
devices that matter for an iOS app, zero font-swap layout shift, and no
render-blocking font fetch.

### Two type scales, on purpose

- `--app-*` — the app's exact point values (17/24 body, 30/36 title1, 56/68
  statHero…). Used **inside the phone frame**, via `calc(N * var(--pt))`, so the
  rendered screen is proportionally identical to the real app.
- `--web-*` — an editorial scale for the page. **This is the only intentional
  divergence, and only in size.** Family, weights, tracking and spacing rhythm
  are the app's. Rationale: the app's largest type is 56pt on a 440pt-wide
  screen — 13% of width. Shipping phone-sized type to a 1440px browser is not
  fidelity, it is a category error. The clamps land in the same optical register
  at each breakpoint.

`--web-body` is `1.0625rem` = 17px — the app's body size, unchanged.

---

## 2. Job 2 — the page

### The idea

The page reads as an **instrument**, not a brochure. Lumo's whole position is
that it tells you how sure it is, so the site is built from the vocabulary of
measurement: hairlines, rules, tick marks, monospaced numerals, a dimension
line. Type and layout carry it — remove every colour and the page still reads as
designed.

**Headline: "Confidently wrong is still wrong."** It is a thesis only this
product could put at the top of its page, it is a claim about a philosophy
rather than about any competitor, and it sets up everything below it.

### Composition

1. **Nav** — wordmark, five links, and a *status readout* on the right (hairline
   + live dot + "Coming soon"). Not a button. Lumo is not on the App Store; a
   badge would be a dead link and a broken promise. `grep status__dot` finds
   every place that changes on launch day.
2. **Hero** — asymmetric. Text column 1.35fr against the device at 1fr, the
   frame hanging below the headline's baseline and bleeding past the container's
   right edge, so the composition has direction instead of being two centred
   blocks. The signature is a **dimension line** — two ticks, a hairline, a
   mono label — drawn from one border and one type token.
3. **Four beats** — the pinned device (§3).
4. **Specification** — a two-column *spec table*, not a card grid. Term,
   description, tier. Dense, scannable, and it carries the free/Pro split
   without pretending to be a pricing table.
5. **The method** — the honesty argument, on an inverted black ground. This is
   where Cal AI puts testimonials. Monochrome, so it introduces no new colour: it
   is the app's own `--primary` used as a surface.
6. **Privacy** — a spec table of what *leaves*, what *stays*, what *never* goes.
7. **FAQ** — native `<details>`, hairline-separated, marker is a rotating
   hairline cross drawn in CSS.
8. **Close** — "Not out yet." and one mailto.

### What was deliberately not done

Every item on the ban list, plus the ones that matter most here: no rounded
soft-shadowed cards as the layout unit (the only shadow left on the page is the
device's elevation), no decorative pills, no icon-heading-two-lines triplets in a
three-column grid, no centred-everything, no gradient CTA. The one "Get started"
-shaped element on the page is a word with a 2px rule under it.

**Critique pass — "could this be any nutrition app's landing page?"** The
weakest element was the pinned-phone scrollytelling, which is a common pattern.
It stays because what is *in* the phone is not common: real app DOM whose numbers
change meaningfully with scroll, rather than a screenshot that fades in. The
phone is also on the **left**, which almost nothing does. Everything else — the
spec table, the dimension line, the inverted method section, the instrument voice
— is not template shape.

---

## 3. The device and the scroll animation

### Frame

Drawn in code from **verified** first-party numbers, not assumed ones:

| | Value | Source |
|---|---|---|
| Screen | 1320×2868 px = **440×956 pt** @3x | Apple tech specs; CoreSimulator `profile.plist` |
| Aspect | exactly **110:239** | 1320:2868 ÷ gcd 12. *Not* 19.5:9, which is off ~0.3% |
| Corner | **62.0 pt**, and it is a **continuous** corner | `UIScreen._displayCornerRadius`; cross-checked against Apple's framebuffer mask |
| Dynamic Island | **125.65 × 37.0 pt**, 13.84 pt from top, centred | measured from a booted simulator screenshot |

The corner is the detail that matters. `border-radius: 62px` draws a *circular*
arc and reads visibly too tight — the real curve runs **85 pt** inward from each
corner. The frame uses **Apple's exact bezier path**, lifted from the
CoreSimulator framebuffer-mask PDF and divided by 3, applied as an
`objectBoundingBox` clip path so it scales.

Inside it is **real DOM built from the shared tokens** — every size is
`calc(N * var(--pt))` where N is the app's real point value.

### Animation

One passive scroll listener → one `requestAnimationFrame` → a quantised 0–1
progress. **Transform and opacity only.** Geometry is cached and re-measured by a
`ResizeObserver`, so the scroll handler never reads layout. Progress-driven, so
it runs backwards on scroll-up and shows the right frame if you land mid-section.

**No Framer Motion.** It is ~40–60 KB gzipped to do what forty lines of rAF does,
on a static-export page where LCP is the point, and it would be the only runtime
dependency beyond React. The brief permits either approach provided the choice is
consistent — this is the JS path, used for every scroll-driven element, with no
second mechanism anywhere.

### Degradation

**The static layout is what ships in the HTML.** The pinned version is an
upgrade applied after mount — which is why `beats--pinned` appears **0 times** in
`out/index.html` and there is no hydration mismatch and no CLS.

It stays static permanently when either `prefers-reduced-motion: reduce` or the
viewport is under 60rem. Reduced motion gets a **complete** page, not a frozen
first frame: all four beats fully written out, the device rendered once in its
finished state. Verified — all four beat texts are present in the exported HTML.

The scroll is never trapped: a normal document-flow section with a `sticky`
child. No wheel handler, no `preventDefault`.

---

## 4. Components — 21st.dev

**Nothing adopted. Hand-built.** This was researched rather than assumed, and the
answer holds on two independent grounds.

The dependency maths is absurd for this page. `web/package.json` has four runtime
deps. Every 21st.dev component is Tailwind-classed JSX, and this project has no
Tailwind — so a pasted component is either (a) a DOM skeleton wearing a
`className` string that does nothing, or (b) a reason to install Tailwind +
PostCSS + `components.json` + `clsx` + `tailwind-merge` + Radix + lucide, which
would create **a second token system competing with the CSS custom properties**.
Greys, the Apple-Health accent ramp and the type scale would then exist in two
places that drift. That is a permanent tax.

And the registry's ranking selects for exactly what the brief bans — its newest
headline category is *Gradients & Shaders*. The ban list reads as an inventory of
what wins a thumbnail grid.

---

## 5. Verification

```
npm run typecheck   clean
npm run lint        clean
npm run build       9 routes exported, static export intact
npm run check       PASS
```

Widths **320 / 768 / 1440 / 2560**: zero horizontally-overflowing elements, no
document horizontal scroll, at every one.

- **Contrast:** every text node measured against its effective background.
  **0 AA failures.** Fixed 29 real ones on the way (see §7).
- **Semantics:** one `h1`, `header`/`main`/`footer` landmarks, 4 labelled `nav`s,
  skip link, 28 interactive controls with a visible focus style.
- **SEO preserved:** canonical, `og:image`, `og:title`, `twitter:card`, 2×
  JSON-LD, sitemap, robots, committed `public/og.png` (regenerated for the new
  design; still a committed file, not a route).

`scripts/check.mjs` runs against the **exported HTML** — what actually ships —
and asserts (a) the scroll math, and (b) that no page contains a rating, user
count, testimonial, press mention, star glyph, affirmative Apple Health claim,
or `±` calorie range.

### ⚠️ What I could not verify

**The scroll animation was never observed running.** The browser pane in this
environment reports `visibilityState: "hidden"`, so `requestAnimationFrame`
never fires, scroll events are never dispatched, and screenshots return blank.
Confirmed by attaching a bare listener and watching it record zero events while
`scrollY` changed. The pure progress→beat mapping is extracted to
`lib/scroll.ts` and asserted in `scripts/check.mjs`; the DOM half needs a real,
painting browser. **Please scroll the features section yourself before merging.**

While chasing this I did find a genuine bug: `overflow-x: hidden` on `body`
forces `overflow-y` from `visible` to `auto`, turning body into a scroll
container. It is now `overflow-x: clip` on `html`, which suppresses overflow
without creating one.

---

## 6. Claims removed — the important part

The site was making claims the app does not support. Found by auditing every
claim against the implementation. These are corrected in the new copy.

| Claim (old site) | Reality |
|---|---|
| "Apple Health, Strava and WHOOP connect in a couple of taps" | **Lumo has no Apple Health integration in any form.** `src/lib/health/appleHealth.ts` is a null-module seam whose only importer is its own unit test — no UI row, no native module, no entitlement. Strava/WHOOP are code-complete but have no registered OAuth apps, so `/connect` returns 503 today. |
| "585±65 kcal" (**the hero visual**) and "every estimate comes with a range" | **No calorie range exists anywhere in the app.** The scan review renders a single integer and a separate confidence percentage. The `±` notation was invented for the website. |
| "when it isn't sure, it asks you instead of guessing — say, whether the curry has coconut cream" | No ingredient-level clarification exists. The *only* thing the app asks is a whole-plate weight choice when two camera angles disagree. The coconut-cream example is fabricated. |
| "Rice portion is the least certain — tap to confirm" | No per-item uncertainty ranking. Confidence is one session-level score. |
| A labelled plate-geometry diagram, "measured portions" | The app renders no geometry diagram, and "measured" overstates it: the plate diameter is *assumed*, region depth is a fixed default. Source comment: "crude colour-fraction heuristic, not real plate segmentation". |
| "Tap any number to see how it was calculated" | True of exactly one surface — cardio parameters, while you are entering them. |
| "estimates get tighter over time" | Nothing gets tighter; there is no interval. Corrections shift the centre via an EWMA multiplier. |
| "US$8.99 / US$49.99" | Appears in no code and no configured App Store product. Removed — the site now says pricing is shown by Apple before you are charged. |
| "photos … not retained afterwards" | True of Lumo's storage; incomplete as stated, since every photo is transmitted to Google Gemini. Now says so explicitly. |

Also softened to match reality: the cuisine library is described as a starting
library (135 foods, 8 groups) rather than encyclopaedic; ACSM maths is scoped to
the four machines that have parameter schemas, with strength work described as
the coarser MET estimate it is; the streak freeze is **one per streak**, not a
pool.

---

## 7. Bugs found and fixed while building

1. **Layout blowout at 320px.** A fixed-width `PhoneFrame` set a grid item's
   min-content to 340px, forcing the whole grid past the 280px content box.
   Frame is now fluid (`min(width, 100%)`), plus `min-width: 0` shrink guards.
2. **`overflow-x: hidden` on body** made body a scroll container (see §5).
3. **Scroll progress frozen at 0.** `sectionRef` was only attached in the
   *pinned* branch, but the mount effect ran while the *static* branch was
   rendered — it measured nothing. Now a callback ref, so the geometry is
   measured exactly when the element appears.
4. **29 WCAG AA contrast failures.** `--ink-tertiary` (#8A8A8A) was used for
   `.index`, `.caption`, `.spec__tier` and the footer bottom line — all real
   text. `tokens.css` documents that token as "glyphs only, ≥3:1, never body
   text"; I had violated my own rule. All moved to `--ink-secondary`.
5. **Class collision** — the hero reused `.beats__caption`, so the hero's
   caption and the pinned device's caption were the same selector. Renamed.

---

## 8. Needs your decision

### 8.1 The Cal AI claim — I did not publish it, and you should not

The brief asked me to reference that "Cal AI was independently found to
underestimate calories substantially and was pulled from the App Store in April
2026." **I verified this and it is false as written.** It fuses two unrelated
events:

- **The accuracy study is real but is not about Cal AI specifically.** NIH/NIDDK
  researchers presented at NUTRITION 2026 (July) that **four** photo-based apps —
  MyFitnessPal, LoseIt!, Cal AI and Appediet — underestimated meals by ~250–345
  kcal on average across 102 controlled-kitchen meals. **No per-app figure was
  published.** It is a conference abstract, which the publishing body explicitly
  labels preliminary and not peer-reviewed.
- **The removal was real but for a different reason, and it was reversed.** Apple
  pulled Cal AI in April 2026 for **subscription-billing violations** (bypassing
  IAP via a Stripe/Superwall flow; deceptive pricing presentation). Not one
  source links it to accuracy. It lasted days, the developer fixed the payment
  screens, and **Cal AI is currently live and top-10 in Health & Fitness**,
  owned by MyFitnessPal since March 2026.

Publishing it would name an identified competitor, impute regulatory expulsion
for a defect they were not expelled for, and do so from an Australian trading
entity — s18 Australian Consumer Law misleading-conduct territory with trade
defamation on top, against an owner with the resources to act.

**I also chose not to cite the study generically**, though that would have been
safe on its own. Citing "photo apps underestimate by 250–345 kcal" invites the
obvious question, and any implied "…but Lumo is accurate" becomes *our* s18
problem, because **Lumo's own estimates have never been benchmarked against
weighed meals**. The honesty section instead argues from method and optics, which
is entirely true, entirely ours, and needs no competitor at all.

### 8.2 The privacy policy is not APP-compliant — get a lawyer, do not let me write it

`web/app/privacy/page.tsx` is a reasonable plain-English notice, but it is **not
an Australian Privacy Principles-compliant policy for an entity handling health
information**. Verified gaps, in priority order:

1. **No express consent mechanism for sensitive information (APP 3.3).** Health
   information is the strictest category in the regime and this is the core
   requirement. The policy describes collection as a fact, never as consented to.
2. **No APP 1.4 complaints procedure** and no OAIC escalation path.
3. **No APP 8 overseas-disclosure statement**, despite routing meal photos and
   body stats to Gemini and Anthropic — the processors are named, their
   cross-border character is not.
4. **No legal entity identification** — no company name beyond "Lumo", no ABN, no
   registered address.
5. **The words "Privacy Act", "Australian Privacy Principles" and "sensitive
   information" appear nowhere**, while `terms/page.tsx` already commits to South
   Australian governing law. The company holds itself out as Australian
   everywhere except the one document where jurisdiction carries legal weight.

**Do not have me or any other model draft the replacement.** A wrong consent
formulation is worse than the current silence, because it creates a documented
false representation about how consent was obtained. This is a legal engagement,
not a copy edit.

I deliberately did **not** add a Washington My Health My Data page — that is
US-state-specific and irrelevant to an Australian entity.

### 8.3 Smaller items

- **Free scan allowance.** The site says "3 a day free". That is
  `LUMO_FREE_SCANS_PER_DAY`, default 3 but **env-tunable** — pin it in production
  config or the site and the product disagree.
- **7-day trial.** The site says 7 days, matching the app's `TRIAL_DAYS`. The
  RevenueCat dashboard is not yet configured; if it is ever set to 14, the site
  becomes a 3.1.2 problem.
- **Two app bugs surfaced by this audit, worth fixing in the app**: the scan
  review's "Why?" panel shows **synthesised** confidence factors ("Food
  identified +55") rather than the real ones the server computed and stored — for
  an honesty-positioned product that is the sharpest exposure in the codebase,
  and it is a small fix (plumb `scan_results.confidence.factors` to the badge).
  And the client's confidence bands (green ≥85) contradict the server's (High
  ≥55, single-angle capped at 55), so nearly every real scan renders red.
- **The name.** The site says Lumo throughout; the iOS project is still Veltai.
  Unchanged here — that decision is yours, and it is listed in
  `SUBMISSION_READINESS.md` §4.
