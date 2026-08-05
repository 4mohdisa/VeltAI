/// <reference types="jest" />
/// <reference types="node" />
// The scan-confidence contract between the Go pipeline and the review card.
//
// Two defects shipped here and both survived four prior audits:
//
//  1. BANDS. The client banded on its own constants (green >=85, amber >=60).
//     The server's positives sum to at most +65 and single_angle is ALWAYS -10,
//     so a PERFECT single-angle scan scores exactly 55 and the server labels it
//     "High" — which the client painted RED. Green was unreachable. The first
//     tester's first scan reads as a failure.
//
//  2. THE "WHY?" PANEL. It synthesised its factors client-side ("Food
//     identified +55", "Lighting & framing +15") while the server's real
//     factors sat unread in the same payload. A provenance disclosure with
//     invented provenance, in a product positioned on honesty.
//
// These tests pin BOTH the numbers and the plumbing, and the threshold test
// reads the Go source so the two cannot drift apart silently.
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  bandForScore,
  displayBand,
  CONFIDENCE_HIGH_MIN,
  CONFIDENCE_MEDIUM_MIN,
} from '@/lib/food/confidence';

const repo = (p: string) => readFileSync(join(__dirname, '..', '..', p), 'utf8');
const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('client bands are the server bands', () => {
  // Mirrors backend/internal/scan/pipeline/confidence_bands_test.go exactly.
  test.each([
    [100, 'High'],
    [55, 'High'],
    [54, 'Medium'],
    [35, 'Medium'],
    [34, 'Low'],
    [0, 'Low'],
  ])('score %i bands as %s', (score, want) => {
    expect(bandForScore(score as number)).toBe(want);
  });

  test('the thresholds still match the Go source they mirror', () => {
    const go = repo('backend/internal/scan/pipeline/confidence.go');
    // func confidenceLabel(score int) string { switch { case score >= 55: ... case score >= 35: ... } }
    const thresholds = [...go.matchAll(/case\s+score\s*>=\s*(\d+)\s*:/g)].map((m) => Number(m[1]));
    expect(thresholds).toEqual([CONFIDENCE_HIGH_MIN, CONFIDENCE_MEDIUM_MIN]);
  });

  test('a perfect single-angle scan does not render red', () => {
    // The exact regression: server says High at 55; the old client said red.
    expect(displayBand(undefined, 55)).toBe('High');
    expect(displayBand('High', 55)).toBe('High');
  });

  test('the server label wins over the score when both are present', () => {
    // If the server ever moves its thresholds, its label is still authoritative.
    expect(displayBand('High', 12)).toBe('High');
    expect(displayBand('Low', 99)).toBe('Low');
  });

  test('an absent or unrecognised label falls back to the server thresholds', () => {
    expect(displayBand(undefined, 40)).toBe('Medium');
    expect(displayBand('', 40)).toBe('Medium');
    expect(displayBand('Excellent', 20)).toBe('Low');
  });
});

describe('the "Why?" panel shows the server\'s factors, never its own', () => {
  const badge = src('components/food/scan/ConfidenceBadge.tsx');

  test('the badge synthesises nothing', () => {
    expect(badge).not.toContain('synthesizeBreakdown');
    // The literal invented factors that shipped.
    expect(badge).not.toContain('Food identified');
    expect(badge).not.toContain('Portion size estimated');
    expect(badge).not.toContain('Lighting & framing');
    expect(badge).not.toContain('Minor portion uncertainty');
    expect(badge).not.toContain('Portion & ingredients unclear');
  });

  test('the badge holds no colour thresholds of its own', () => {
    // Banding belongs to @/lib/food/confidence, which mirrors the server.
    expect(badge).toContain("from '@/lib/food/confidence'");
    expect(badge).not.toMatch(/score\s*>=\s*85/);
    expect(badge).not.toMatch(/score\s*>=\s*60/);
  });

  test('with no server factors the panel says so instead of inventing them', () => {
    expect(badge).toContain("didn&apos;t return a breakdown");
  });

  test('the scan seam keeps the label and factors it used to discard', () => {
    const scan = src('lib/data/scan.ts');
    expect(scan).toContain('confidenceLabel: sr?.confidence?.label');
    expect(scan).toContain('confidenceFactors: sr?.confidence?.factors');
  });

  test('the review card receives them end to end', () => {
    expect(src('app/(tabs)/food.tsx')).toContain('confidenceFactors: it.confidenceFactors');
    const card = src('components/food/scan/ScanReviewCard.tsx');
    expect(card).toContain('breakdown={it.confidenceFactors}');
    expect(card).toContain('label={it.confidenceLabel}');
  });
});
