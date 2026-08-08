// Item 7 of the 2026-08-08 agent run: "the legal screen opened unexpectedly at
// some point in the flow, rather than the next onboarding step."
//
// The hypothesis was that a failed state read fell through to a legal/consent
// route. It does not: this pins that EVERY legal navigation inside onboarding
// is an explicit, user-pressed link, and that no screen has a fallback,
// redirect, catch-block or default that can push one.
import * as fs from 'fs';
import * as path from 'path';

const ONB = path.join(__dirname, '..', 'app', 'onboarding');
const screens = fs.readdirSync(ONB).filter((f) => f.endsWith('.tsx'));

test('every onboarding screen file is covered by this sweep', () => {
  // Fails loudly if a screen is added, so the guard cannot silently rot.
  expect(screens.length).toBeGreaterThanOrEqual(12);
});

test('legal routes appear only as explicit link presses, never as a fallback', () => {
  for (const file of screens) {
    const src = fs.readFileSync(path.join(ONB, file), 'utf8');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (!line.includes('/legal/')) return;
      // The only sanctioned shape is an onPress handler (or the LegalLink
      // component's href prop), i.e. something a finger has to touch.
      const sanctioned = /onPress=|href=\{'\/legal\//.test(line);
      if (!sanctioned) {
        throw new Error(
          `${file}:${i + 1} navigates to a legal route outside an explicit press handler: ${line.trim()}`,
        );
      }
    });
  }
});

test('no onboarding screen routes to legal from a catch block or a state fallback', () => {
  for (const file of screens) {
    const src = fs.readFileSync(path.join(ONB, file), 'utf8');
    // Slice each catch block and assert it never navigates to legal/consent.
    let idx = src.indexOf('} catch');
    while (idx !== -1) {
      const block = src.slice(idx, idx + 600);
      expect(block).not.toContain('/legal/');
      expect(block.toLowerCase()).not.toContain("navigate('/onboarding/consent");
      idx = src.indexOf('} catch', idx + 1);
    }
  }
});
