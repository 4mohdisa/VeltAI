/* The four in-frame screens, rebuilt as real DOM from the app's own tokens.
   ==========================================================================

   Structure, spacing, radii, type sizes and strings were read out of the app
   (src/app/(tabs)/food.tsx, src/components/food/scan/ScanReviewCard.tsx,
   src/components/domain/EnergyBalanceCard.tsx, src/app/(tabs)/gym.tsx) rather
   than approximated, so a screen here and the same screen in the app are the
   same drawing.

   EVERY SIZE is calc(N * var(--pt)) where N is the app's real point value.
   --pt is set by PhoneFrame, so the whole screen scales proportionally.

   ON THE NUMBERS: these are illustrative — one invented but internally
   consistent day. Food rows sum to 1,840 kcal, which is the same figure the
   energy-balance screen uses for "In (food)", and 1,840 − (1,610 BMR + 650
   exercise) = −420, the net it shows. Nothing here is anyone's real data and
   the page says so in visible copy.

   WHAT IS DELIBERATELY NOT DRAWN: a calorie range (e.g. "585 ± 65"). The app
   has no interval anywhere — the scan review renders a single integer and a
   separate confidence percentage. The previous version of this site invented
   the ± notation and made it the hero visual. Also absent: the confidence
   "Why?" factor breakdown, because the values the app currently shows there
   are synthesised client-side rather than the ones the server computed. Both
   omissions are the point of the product, not oversights. */

import type { CSSProperties, ReactNode } from 'react';

/* ---- primitives -------------------------------------------------------- */

const pt = (n: number) => `calc(${n} * var(--pt))`;

/** App type tokens → CSS. `rounded` maps to SF Pro Rounded via ui-rounded,
 *  the same face the app uses for stat numerals. */
function t(
  size: number,
  lh: number,
  weight: number,
  opts: { rounded?: boolean; color?: string; mono?: boolean } = {},
): CSSProperties {
  return {
    fontSize: pt(size),
    lineHeight: pt(lh),
    fontWeight: weight,
    color: opts.color ?? 'var(--ink)',
    fontFamily: opts.rounded ? 'var(--font-rounded)' : undefined,
    fontVariantNumeric: opts.rounded || opts.mono ? 'tabular-nums' : undefined,
    letterSpacing: opts.rounded ? '-0.02em' : undefined,
    margin: 0,
  };
}

const Screen = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: 'var(--paper)',
      // Status bar is 54pt on this device; content starts below it.
      padding: `${pt(62)} ${pt(20)} 0`,
      display: 'flex',
      flexDirection: 'column',
      gap: pt(16),
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

/** The app's Card: light1 fill, 20pt radius, 20pt padding, NO border, NO shadow. */
const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      background: 'var(--surface)',
      borderRadius: pt(20),
      padding: pt(20),
      display: 'flex',
      flexDirection: 'column',
      gap: pt(16),
      ...style,
    }}
  >
    {children}
  </div>
);

/* ---- 1 · Food log, day view -------------------------------------------- */

export const FOOD_ROWS = [
  { slot: 'Breakfast', name: 'Oats with whey', meta: '80 g · P 32 · C 48 · F 9', kcal: 420 },
  { slot: 'Lunch', name: 'Chicken biryani', meta: '320 g · P 41 · C 74 · F 22', kcal: 680 },
  { slot: 'Snacks', name: 'Greek yoghurt', meta: '170 g · P 17 · C 9 · F 5', kcal: 180 },
  { slot: 'Dinner', name: 'Lamb karahi with salad', meta: '290 g · P 38 · C 21 · F 31', kcal: 560 },
];

/** `filled` (0–1) reveals rows in order — the "day filling up" beat. */
export function FoodLogScreen({ filled = 1 }: { filled?: number }) {
  const shown = filled * FOOD_ROWS.length;
  const total = FOOD_ROWS.reduce(
    (sum, r, i) => sum + (i < Math.floor(shown) ? r.kcal : 0),
    0,
  );
  return (
    <Screen>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={t(30, 36, 800)}>Today</h3>
        <span style={t(15, 21, 400, { color: 'var(--ink-secondary)', mono: true })}>
          {total.toLocaleString('en-US')} kcal
        </span>
      </div>

      {/* Search field — always a 1px border so focus never reflows the row. */}
      <div
        style={{
          background: 'var(--paper)',
          border: `${pt(1)} solid var(--line-strong)`,
          borderRadius: pt(16),
          padding: `${pt(12)} ${pt(20)}`,
          ...t(17, 24, 400, { color: 'var(--ink-tertiary)' }),
        }}
      >
        Search foods…
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: pt(20) }}>
        {FOOD_ROWS.map((row, i) => {
          // Each row fades and rises independently across its slice of progress.
          const p = Math.max(0, Math.min(1, shown - i));
          return (
            <div
              key={row.slot}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: pt(8),
                opacity: p,
                transform: `translate3d(0, ${(1 - p) * 8}px, 0)`,
                willChange: 'opacity, transform',
              }}
            >
              <span style={t(13, 16, 600, { color: 'var(--ink-secondary)' })}>{row.slot}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: pt(12) }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: pt(4), minWidth: 0 }}>
                  <span style={t(17, 24, 400)}>{row.name}</span>
                  <span style={t(13, 18, 400, { color: 'var(--ink-secondary)', mono: true })}>
                    {row.meta}
                  </span>
                </div>
                <span style={t(17, 24, 500, { mono: true })}>{row.kcal}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

/* ---- 2 · Scan review ---------------------------------------------------- */

/** `settle` (0–1) drives the two things that actually move in the app: the
 *  confidence score arriving, and the weight slider being dragged. */
export function ScanReviewScreen({ settle = 1 }: { settle?: number }) {
  // The app's confidence bands are the SERVER's: High >= 55, Medium >= 35.
  // A single-angle scan is capped at 55 by design, so 62 here reflects a
  // two-angle scan that agreed — which is exactly the story beside it.
  const score = Math.round(62 * settle);
  const grams = Math.round(240 + 80 * settle); // 240 → 320 g as the slider moves
  const kcal = Math.round(grams * 2.125); // 320 g → 680 kcal, matching the food log

  return (
    <Screen>
      <h3 style={t(30, 36, 800)}>Today</h3>

      {/* The review card carries a 4pt accent rail — the one place colour
          appears in this screen, and it is status, not decoration. */}
      <div
        style={{
          display: 'flex',
          background: 'var(--surface)',
          borderRadius: pt(20),
          overflow: 'hidden',
        }}
      >
        <div style={{ width: pt(4), flex: 'none', background: 'var(--data-calories)' }} />
        <div
          style={{
            flex: 1,
            padding: pt(16),
            display: 'flex',
            flexDirection: 'column',
            gap: pt(16),
            minWidth: 0,
          }}
        >
          <span style={t(19, 25, 600)}>Review before saving</span>

          {/* Two angles agreed — the real reconciliation line. */}
          <span style={t(13, 18, 400, { color: 'var(--ink-secondary)' })}>
            Angles agree 91% · estimates merged
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: pt(12) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: pt(8) }}>
              <span style={t(17, 24, 500)}>Chicken biryani</span>
              <span style={t(17, 24, 500, { mono: true })}>{kcal} kcal</span>
            </div>

            {/* Weight slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: pt(8) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={t(13, 18, 400, { color: 'var(--ink-secondary)' })}>Weight</span>
                <span style={t(13, 18, 500, { mono: true })}>{grams} g</span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: pt(4),
                  borderRadius: pt(999),
                  background: 'var(--line)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transformOrigin: 'left center',
                    transform: `scaleX(${0.35 + 0.35 * settle})`,
                    background: 'var(--primary)',
                    borderRadius: pt(999),
                    willChange: 'transform',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${(0.35 + 0.35 * settle) * 100}%`,
                    width: pt(22),
                    height: pt(22),
                    marginTop: pt(-11),
                    marginLeft: pt(-11),
                    borderRadius: pt(999),
                    background: 'var(--paper)',
                    boxShadow: 'var(--shadow-md)',
                    willChange: 'left',
                  }}
                />
              </div>
              <span style={t(13, 18, 400, { color: 'var(--ink-secondary)' })}>
                Typical for you: 310 g
              </span>
            </div>

            {/* Confidence — a percentage and a label, which is all the app shows. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: pt(8) }}>
              <span
                style={{
                  width: pt(8),
                  height: pt(8),
                  borderRadius: pt(999),
                  background: 'var(--data-positive)',
                  flex: 'none',
                }}
              />
              <span style={t(13, 18, 500, { mono: true })}>{score}% confidence</span>
              <span style={t(13, 18, 400, { color: 'var(--ink-secondary)' })}>· High</span>
            </div>
          </div>

          <div
            style={{
              alignSelf: 'stretch',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              borderRadius: pt(999),
              padding: `${pt(12)} ${pt(20)}`,
              textAlign: 'center',
              ...t(17, 24, 600, { color: 'var(--on-primary)' }),
            }}
          >
            Save all items
          </div>
        </div>
      </div>

      {/* The review card sits at the TOP of the food log in the app, above the
          day's existing entries — not alone on an empty screen. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: pt(20) }}>
        {FOOD_ROWS.slice(0, 2).map((row) => (
          <div key={row.slot} style={{ display: 'flex', flexDirection: 'column', gap: pt(8) }}>
            <span style={t(13, 16, 600, { color: 'var(--ink-secondary)' })}>{row.slot}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: pt(12) }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: pt(4), minWidth: 0 }}>
                <span style={t(17, 24, 400)}>{row.name}</span>
                <span style={t(13, 18, 400, { color: 'var(--ink-secondary)', mono: true })}>
                  {row.meta}
                </span>
              </div>
              <span style={t(17, 24, 500, { mono: true })}>{row.kcal}</span>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---- 3 · Energy balance ------------------------------------------------- */

const IN_KCAL = 1840;
const BMR = 1610;
const EXERCISE = 650;
const OUT_KCAL = BMR + EXERCISE; // 2,260
const NET = IN_KCAL - OUT_KCAL; // −420

/** `settle` (0–1) grows both bars and counts the net figure in. */
export function EnergyBalanceScreen({ settle = 1 }: { settle?: number }) {
  const net = Math.round(NET * settle);
  const max = Math.max(IN_KCAL, OUT_KCAL);
  return (
    <Screen>
      <h3 style={t(30, 36, 800)}>Today</h3>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={t(19, 25, 600)}>Energy balance</span>
          <span
            style={{
              background: 'var(--paper)',
              borderRadius: pt(999),
              padding: `${pt(4)} ${pt(12)}`,
              ...t(13, 16, 600),
            }}
          >
            Deficit
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: pt(4) }}>
          <span style={t(40, 50, 800, { rounded: true })}>{net}</span>
          <span style={t(13, 18, 400, { color: 'var(--ink-secondary)' })}>
            net kcal today (burning more than eaten)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: pt(12) }}>
          {[
            { label: 'In (food)', value: IN_KCAL, tint: 'var(--data-calories)' },
            { label: `Out (BMR ${BMR.toLocaleString('en-US')} + exercise ${EXERCISE})`, value: OUT_KCAL, tint: 'var(--data-fat)' },
          ].map((bar) => (
            <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', gap: pt(4) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: pt(8) }}>
                <span style={t(11, 14, 500, { color: 'var(--ink-secondary)' })}>{bar.label}</span>
                <span style={t(11, 14, 500, { mono: true })}>
                  {bar.value.toLocaleString('en-US')} kcal
                </span>
              </div>
              <div
                style={{
                  height: pt(8),
                  borderRadius: pt(999),
                  background: 'var(--line)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: pt(999),
                    background: bar.tint,
                    transformOrigin: 'left center',
                    // Width is fixed; only the transform animates, so this never
                    // triggers layout during a scroll.
                    width: `${(bar.value / max) * 100}%`,
                    transform: `scaleX(${settle})`,
                    willChange: 'transform',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Screen>
  );
}

/* ---- 4 · Gym, today's workout ------------------------------------------- */

const EXERCISES = ['Bench press', 'Overhead press', 'Incline dumbbell press', 'Cable fly'];

/** `done` (0–1) ticks exercises off in order. */
export function GymScreen({ done = 1 }: { done?: number }) {
  const completed = done * EXERCISES.length;
  return (
    <Screen>
      <h3 style={t(30, 36, 800)}>Gym</h3>
      <Card style={{ gap: pt(12) }}>
        <span style={t(19, 25, 600)}>Push A</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: pt(8) }}>
          {EXERCISES.map((name, i) => {
            const p = Math.max(0, Math.min(1, completed - i));
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: pt(8) }}>
                {/* Completion is shape + opacity, never colour alone. */}
                <span
                  style={{
                    width: pt(16),
                    height: pt(16),
                    flex: 'none',
                    borderRadius: pt(999),
                    border: `${pt(1.5)} solid var(--ink-tertiary)`,
                    background: p > 0.5 ? 'var(--primary)' : 'transparent',
                    borderColor: p > 0.5 ? 'var(--primary)' : 'var(--ink-tertiary)',
                    display: 'grid',
                    placeItems: 'center',
                    transition: 'none',
                  }}
                >
                  <span
                    style={{
                      ...t(11, 11, 700, { color: 'var(--on-primary)' }),
                      opacity: p > 0.5 ? 1 : 0,
                    }}
                  >
                    ✓
                  </span>
                </span>
                <span
                  style={{
                    ...t(15, 21, 400, { color: 'var(--ink-secondary)' }),
                    textDecoration: p > 0.5 ? 'line-through' : 'none',
                    opacity: p > 0.5 ? 0.55 : 1,
                  }}
                >
                  {name}
                </span>
              </div>
            );
          })}
        </div>
        <span style={t(13, 18, 400, { color: 'var(--ink-secondary)' })}>~55 min</span>
        <div
          style={{
            background: 'var(--primary)',
            borderRadius: pt(999),
            padding: `${pt(16)} ${pt(28)}`,
            textAlign: 'center',
            ...t(17, 24, 600, { color: 'var(--on-primary)' }),
          }}
        >
          {completed >= EXERCISES.length ? 'Check in' : 'Start Workout →'}
        </div>
      </Card>

      {/* Streak hero — flame is categoryAccent.streak, a data colour. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: pt(4) }}>
        <svg
          viewBox="0 0 24 24"
          style={{ width: pt(44), height: pt(44) }}
          fill="var(--data-streak)"
          aria-hidden
        >
          <path d="M12 2c.6 3.2 2.2 4.6 3.6 6C17.3 9.6 19 11.3 19 14a7 7 0 1 1-14 0c0-2 .9-3.6 2-4.8.2 1 .8 1.8 1.7 2 .2-2.7 1.4-5.4 3.3-9.2Z" />
        </svg>
        <span style={t(56, 68, 800, { rounded: true })}>12</span>
        <span style={t(13, 18, 400, { color: 'var(--ink-secondary)' })}>day streak</span>
      </div>
    </Screen>
  );
}
