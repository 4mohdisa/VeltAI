'use client';

/* The pinned device + scroll-linked screens.
   ==========================================================================

   HOW IT WORKS
   One passive scroll listener, coalesced into a single requestAnimationFrame,
   computes a 0–1 progress for the section and quantises it before it reaches
   React. Progress drives `transform` and `opacity` only — never width, height,
   top or any other layout-triggering property — so nothing in the loop can
   force a reflow. The section's geometry is measured once on mount and on
   resize and cached, so the scroll handler never reads layout either.

   It is progress-driven, not fire-once-on-enter: scrolling back up runs it
   backwards, and landing mid-section with a restored scroll position shows the
   correct frame immediately.

   WHY NOT FRAMER MOTION: it is ~40–60 KB gzipped to do what forty lines of
   rAF does here, on a static-export marketing page where LCP is the whole
   point, and it would be the only runtime dependency beyond React. The brief
   allows either Framer's useScroll or a native/JS scroll-timeline approach so
   long as the choice is consistent — this is the JS path, used for every
   scroll-driven element on the page with no second mechanism anywhere.

   PROGRESSIVE ENHANCEMENT
   The server-rendered HTML is the STATIC layout: the frame once, then the four
   copy blocks as ordinary prose. That is what ships to a crawler, to a browser
   before hydration, and to anyone the checks below opt out. The pinned version
   is an upgrade applied after mount, which is why there is no hydration
   mismatch and no layout shift when JS arrives.

   It stays static — permanently — when EITHER:
     · prefers-reduced-motion: reduce  → a complete, readable page, not a
       frozen half-animation. Each block sits beside its own finished screen.
     · the viewport is under 60rem      → pinning a phone inside a phone is
       silly, and a sticky element that tall would eat a small screen.

   The scroll is never trapped: the section is a normal document-flow element
   with a `position: sticky` child. There is no scroll hijacking, no wheel
   handler, and no preventDefault anywhere. */

import { useCallback, useEffect, useRef, useState } from 'react';

import { beatAt, progressAt } from '@/lib/scroll';
import { PhoneFrame } from './device/PhoneFrame';
import {
  EnergyBalanceScreen,
  FoodLogScreen,
  GymScreen,
  ScanReviewScreen,
} from './device/screens';

export type Beat = {
  index: string;
  title: string;
  body: string;
  /** Screen caption — what the reader is looking at, for the static layout. */
  caption: string;
};

export const BEATS: Beat[] = [
  {
    index: '01',
    title: 'A day, logged four different ways',
    body:
      'Search a food, scan a barcode, photograph a nutrition label, or point the camera at the plate. Packaged food resolves to the manufacturer’s own numbers from Open Food Facts or the USDA database — no estimating where none is needed.',
    caption: 'Food log, day view',
  },
  {
    index: '02',
    title: 'The estimate arrives with a confidence score',
    body:
      'Lume scores every photo estimate out of 100 from things it can actually check: whether the image was sharp, whether the lighting was good, whether a plate was found to give it scale, and whether the macros came from a real food database rather than the model’s guess. Take a second angle and it compares the two independent estimates — if they disagree, it shows you both and asks which is right instead of quietly averaging them away.',
    caption: 'Scan review, two angles agreeing',
  },
  {
    index: '03',
    title: 'Both sides of the ledger',
    body:
      'Calories in from what you logged; calories out from your BMR plus the work you actually did. Cardio burn on a treadmill, bike, rower or stair climber is computed from the published ACSM metabolic equations for that machine, using the speed, incline, watts or split time you enter — and the app will show you the equation it used.',
    caption: 'Energy balance, today',
  },
  {
    index: '04',
    title: 'The gym half, without the guilt mechanics',
    body:
      'Set which workout runs on each day of the week and check in when you are done. It works offline and syncs later without duplicating the session. Miss a day and you can spend your one streak freeze rather than losing everything — there is no manufactured urgency and the app sends no notifications at all.',
    caption: 'Today’s workout and streak',
  },
];

/** Screen for a beat at a given within-beat progress (0–1). */
function ScreenFor({ beat, p }: { beat: number; p: number }) {
  if (beat === 0) return <FoodLogScreen filled={p} />;
  if (beat === 1) return <ScanReviewScreen settle={p} />;
  if (beat === 2) return <EnergyBalanceScreen settle={p} />;
  return <GymScreen done={p} />;
}

export function ScrollScreens() {
  // A CALLBACK ref, not useRef. The pinned markup only exists after `pinned`
  // flips true, so a plain ref is still null when the mount effect runs — the
  // geometry would be measured against nothing and progress would sit at 0
  // forever. This fires exactly when the element appears.
  const [section, setSection] = useState<HTMLElement | null>(null);
  const sectionRef = useCallback((node: HTMLDivElement | null) => setSection(node), []);
  const geom = useRef({ top: 0, span: 1 });
  const [pinned, setPinned] = useState(false);
  const [progress, setProgress] = useState(0);

  // Which layout to use. Watched separately from the scroll wiring so a
  // viewport or motion-preference change re-evaluates it on its own.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 60rem)');
    const sync = () => setPinned(wide.matches && !reduced.matches);
    sync();
    reduced.addEventListener('change', sync);
    wide.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    return () => {
      reduced.removeEventListener('change', sync);
      wide.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  // Scroll wiring. Only runs once the pinned section is actually in the DOM.
  useEffect(() => {
    if (!section) return;

    const measure = () => {
      geom.current.top = section.getBoundingClientRect().top + window.scrollY;
      // The distance over which progress runs 0→1: the section's scrollable
      // extent past the viewport.
      geom.current.span = Math.max(1, section.offsetHeight - window.innerHeight);
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const { top, span } = geom.current;
        // Quantised so a full scroll produces ~200 state updates, not 1 per
        // frame — imperceptible in motion, a fraction of the render cost.
        const q = Math.round(progressAt(window.scrollY, top, span) * 200) / 200;
        setProgress((prev) => (prev === q ? prev : q));
      });
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // The section's own height can change without a window resize (fonts
    // settling, a wrapped line). Re-measure when it does, or the mapping from
    // scroll position to progress silently drifts.
    const ro = new ResizeObserver(onResize);
    ro.observe(section);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [section]);

  // Which beat, and how far through it. Pure — asserted in scripts/check.mjs.
  const { active, within } = beatAt(progress, BEATS.length);

  /* ---- static layout: the HTML that ships, and the permanent layout on
     small viewports or with reduced motion. Each block is complete on its
     own; the frame appears once, finished, and carries no meaning the copy
     does not already say. ---- */
  if (!pinned) {
    return (
      <div className="beats beats--static">
        <div className="beats__figure" aria-hidden>
          <PhoneFrame width={280}>
            <ScanReviewScreen settle={1} />
          </PhoneFrame>
          <p className="eyebrow caption">Scan review · illustrative</p>
        </div>
        <ol className="beats__list">
          {BEATS.map((b) => (
            <li key={b.index} className="beats__item">
              <p className="index">{b.index}</p>
              <h3>{b.title}</h3>
              <p className="muted small">{b.body}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  /* ---- pinned layout ---- */
  return (
    <div
      className="beats beats--pinned"
      ref={sectionRef}
      /* Exposed so the scroll mapping is inspectable in the DOM rather than
         trapped in component state — it is how this was debugged, and how a
         regression in it would be caught. */
      data-progress={progress.toFixed(3)}
      data-beat={active}
    >
      {/* The device is decorative: every screen it shows is described in the
          copy column, so a screen reader loses nothing by skipping it. */}
      <div className="beats__sticky" aria-hidden>
        <PhoneFrame width={300}>
          {BEATS.map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                // Cross-fade. Opacity only — the outgoing screen is not moved,
                // so there is no transform thrash between two full subtrees.
                opacity: i === active ? 1 : 0,
                willChange: 'opacity',
              }}
            >
              <ScreenFor beat={i} p={i === active ? within : i < active ? 1 : 0} />
            </div>
          ))}
        </PhoneFrame>
        <p className="eyebrow caption">
          {BEATS[active].caption} · illustrative
        </p>
      </div>

      <ol className="beats__list">
        {BEATS.map((b, i) => (
          <li
            key={b.index}
            className="beats__item"
            data-active={i === active ? 'true' : undefined}
          >
            <p className="index">{b.index}</p>
            <h3>{b.title}</h3>
            <p className="muted small">{b.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
