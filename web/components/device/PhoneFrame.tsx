/* iPhone 17 Pro Max frame, drawn in code.
   ==========================================================================

   Every number here was verified against first-party Apple sources rather than
   assumed, because a device frame with the wrong proportions or a circular
   corner radius reads as "stock mockup" instantly:

     screen        1320 x 2868 px = 440 x 956 pt @3x   (Apple tech specs;
                   CoreSimulator profile.plist mainScreenWidth/Height/Scale)
     aspect        exactly 110:239 (1320:2868 / gcd 12). NOT 19.5:9, which is
                   off by ~0.3% and visibly wrong over 900pt of height.
     corner        62.0 pt radius — but it is a CONTINUOUS corner (squircle),
                   not a circular arc. The curve runs 85 pt inward from the
                   corner along both edges. `border-radius: 62px` draws a
                   circular arc and reads noticeably too tight; the exact
                   Apple path is used instead (see CORNER below).
     Dynamic Island 125.65 x 37.0 pt, 13.84 pt from the top edge, horizontally
                   centred, capsule (radius = height/2 = 18.5 pt).

   The corner path is Apple's own, lifted from the CoreSimulator framebuffer
   mask PDF for this device and divided by 3 to get points. That mask file is
   byte-identical to the iPhone 16 Pro Max one, which is what proves the two
   displays share geometry.

   The screen is real DOM, not an image: it stays crisp at any density, it
   animates, and it cannot go stale relative to the app's tokens. */

import type { CSSProperties, ReactNode } from 'react';

export const SCREEN_W = 440;
export const SCREEN_H = 956;

/** Apple's continuous-corner path, bottom-left corner, in points, origin at
 *  the corner, +x along the bottom edge, +y up the left edge. 1 move + 6 cubic
 *  segments. Runs from (85.163, 0) on the horizontal edge to (0, 85) on the
 *  vertical edge. */
const CORNER: [number, number][] = [
  [85.163, 0],
  [79.788, 0], [74.414, 0.016], [69.039, 0.215],
  [62.884, 0.443], [56.797, 0.91], [50.721, 2.042],
  [38.458, 4.328], [27.304, 9.289], [18.296, 18.297],
  [9.288, 27.305], [4.326, 38.461], [2.041, 50.726],
  [0.91, 56.797], [0.443, 62.879], [0.215, 69.031],
  [0.017, 74.354], [0, 79.676], [0, 85.0],
];

type Corner = { map: (x: number, y: number) => [number, number]; reverse: boolean };

/* Traversed clockwise from the top edge. `reverse` is set where the clockwise
   direction runs vertical-edge → horizontal-edge, the opposite of how Apple's
   path is authored. Reversing a poly-bezier is just reversing the point list. */
const CORNERS: Corner[] = [
  { map: (x, y) => [SCREEN_W - x, y], reverse: false },               // top-right
  { map: (x, y) => [SCREEN_W - x, SCREEN_H - y], reverse: true },     // bottom-right
  { map: (x, y) => [x, SCREEN_H - y], reverse: false },               // bottom-left
  { map: (x, y) => [x, y], reverse: true },                           // top-left
];

/** Build the screen outline as an SVG path, normalised to a 0–1 box so it can
 *  be used as an objectBoundingBox clipPath and scale with the element. */
function screenPath(): string {
  const nx = (v: number) => (v / SCREEN_W).toFixed(6);
  const ny = (v: number) => (v / SCREEN_H).toFixed(6);
  const seg: string[] = [];

  for (let i = 0; i < CORNERS.length; i++) {
    const { map, reverse } = CORNERS[i];
    const pts = reverse ? [...CORNER].reverse() : CORNER;
    const mapped = pts.map(([x, y]) => map(x, y));
    if (i === 0) seg.push(`M${nx(mapped[0][0])},${ny(mapped[0][1])}`);
    else seg.push(`L${nx(mapped[0][0])},${ny(mapped[0][1])}`);
    for (let p = 1; p < mapped.length; p += 3) {
      const [a, b, c] = [mapped[p], mapped[p + 1], mapped[p + 2]];
      seg.push(
        `C${nx(a[0])},${ny(a[1])} ${nx(b[0])},${ny(b[1])} ${nx(c[0])},${ny(c[1])}`,
      );
    }
  }
  seg.push('Z');
  return seg.join('');
}

const SCREEN_PATH = screenPath();
const CLIP_ID = 'lume-screen-clip';

/** One-per-document clip path definition. Rendered by the frame itself; a
 *  second frame on the page reuses the same id harmlessly. */
function ClipDef() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <clipPath id={CLIP_ID} clipPathUnits="objectBoundingBox">
          <path d={SCREEN_PATH} />
        </clipPath>
      </defs>
    </svg>
  );
}

type Props = {
  children: ReactNode;
  /** MAXIMUM rendered width of the device body in px. The frame is fluid below
   *  this — `min(width, 100%)` — because a fixed px width on a grid item sets
   *  its min-content size, which stops the whole grid from shrinking and blows
   *  the layout out horizontally at small viewports. The screen and everything
   *  in it scales from the resolved width, so proportions hold at any size. */
  width?: number;
  className?: string;
  style?: CSSProperties;
};

/* The titanium band. Monochrome (it is the app's own --ink-strong), unbranded,
   no logo, no buttons rendered as decoration — a real device's side buttons are
   not visible from straight on, and drawing them is the mockup-clipart tell. */
const BEZEL_PT = 11; // uniform bezel width in screen-points

export function PhoneFrame({ children, width = 320, className, style }: Props) {
  const bodyW = SCREEN_W + BEZEL_PT * 2;
  const bodyH = SCREEN_H + BEZEL_PT * 2;
  const scale = width / bodyW;

  return (
    <div
      className={className}
      style={{
        // Sized in screen-points then scaled, so one number controls everything.
        width: `min(${width}px, 100%)`,
        aspectRatio: `${bodyW} / ${bodyH}`,
        position: 'relative',
        ...style,
      }}
    >
      <ClipDef />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--ink-strong)',
          // The body's corner is the screen's plus the bezel. Proportional, so
          // a percentage radius keeps the squircle-ish look at any size without
          // a second exact path.
          borderRadius: `${((85 + BEZEL_PT) / bodyW) * 100}% / ${((85 + BEZEL_PT) / bodyH) * 100}%`,
          boxShadow: 'var(--shadow-lg)',
        }}
      />
      {/* Screen. clip-path carries Apple's exact continuous corner. */}
      <div
        style={{
          position: 'absolute',
          inset: `${(BEZEL_PT / bodyH) * 100}% ${(BEZEL_PT / bodyW) * 100}%`,
          clipPath: `url(#${CLIP_ID})`,
          background: 'var(--paper)',
          overflow: 'hidden',
          containerType: 'inline-size',
          // 1pt of app space === this many px. Everything inside sizes off it,
          // so the rendered screen is proportionally identical to the app.
          // cqw is 1% of this element's width; the screen is 440pt wide.
          ['--pt' as string]: `${(100 / SCREEN_W).toFixed(5)}cqw`,
          // Fallback for engines without container queries: fixed px per point.
          fontSize: `${(scale * 1).toFixed(4)}px`,
        }}
      >
        {children}
        {/* Dynamic Island — drawn last so it sits above the screen content,
            exactly as it does on the device. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: `calc(13.84 * var(--pt))`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `calc(125.65 * var(--pt))`,
            height: `calc(37 * var(--pt))`,
            borderRadius: `calc(18.5 * var(--pt))`,
            background: 'var(--primary)',
          }}
        />
      </div>
    </div>
  );
}
