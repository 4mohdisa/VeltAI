/* The pure part of the scroll-driven section: given a 0–1 progress through the
   pinned region and a beat count, which beat is active and how far through it
   are we. Extracted from the component so it can be asserted without a browser
   — the DOM half needs a real, painting browser to test, this half does not. */

export type BeatPosition = { active: number; within: number };

export function beatAt(progress: number, count: number): BeatPosition {
  const p = Math.min(1, Math.max(0, progress));
  const scaled = p * count;
  // The final beat must not roll over to `count` at exactly p = 1.
  const active = Math.min(count - 1, Math.floor(scaled));
  return { active, within: Math.min(1, scaled - active) };
}

/** Map a scroll offset onto 0–1 across a pinned section. `span` is the
 *  section's scrollable extent past the viewport; it is clamped to >= 1 so a
 *  section shorter than the viewport cannot divide by zero. */
export function progressAt(scrollY: number, top: number, span: number): number {
  return Math.min(1, Math.max(0, (scrollY - top) / Math.max(1, span)));
}
