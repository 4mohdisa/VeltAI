// Scan-confidence banding. The SERVER owns these thresholds — this file mirrors
// backend/internal/scan/pipeline/confidence.go confidenceLabel() and must not
// drift from it.
//
// Why this file exists: the client used to band on its own constants (green
// >=85, amber >=60). The server's positive factors sum to at most +65 and
// single_angle is ALWAYS -10, so a *perfect* single-angle scan scores exactly
// 55 and the server calls it "High". Against the old client constants that
// rendered RED, and green was mathematically unreachable — every real scan
// looked like a failure. See backend confidence.go:67-72, which spells out the
// same arithmetic ("the old 85 threshold was mathematically unreachable").
//
// Prefer the label the server actually sent (scan_results.confidence.label).
// bandForScore is the fallback for the synchronous /api/scan path, which
// returns a bare scalar and no label.

/** The server's three bands, verbatim. */
export type ConfidenceBand = 'High' | 'Medium' | 'Low';

/** Server thresholds (confidence.go:73-82). Exported so a test can assert the
 *  client and the Go source still agree. */
export const CONFIDENCE_HIGH_MIN = 55;
export const CONFIDENCE_MEDIUM_MIN = 35;

/** Mirror of the server's confidenceLabel() for a 0..100 score. */
export function bandForScore(score: number): ConfidenceBand {
  if (score >= CONFIDENCE_HIGH_MIN) return 'High';
  if (score >= CONFIDENCE_MEDIUM_MIN) return 'Medium';
  return 'Low';
}

/** The band to display: the server's own label when it sent one, else derived
 *  from the score with the server's thresholds. Never the client's own scale. */
export function displayBand(label: string | undefined, score: number): ConfidenceBand {
  if (label === 'High' || label === 'Medium' || label === 'Low') return label;
  return bandForScore(score);
}
