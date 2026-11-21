// PHASE2_ROWS.md row 74 (screen and navigation transitions). The root stack
// used to pick 'default' outside Reduce Motion — a preset whose duration is
// not customizable (native-stack types.d.ts) — so it carried no deliberate
// ~200ms figure at all. screenAnimation() (src/app/_layout.tsx) now returns a
// short simple_push (its duration IS customizable) outside Reduce Motion, and
// a fade under it, both at motion.duration.snap. This can't run the component
// (Clerk/GestureHandler/expo-font pull in native modules this project's "node"
// jest environment can't load — every other _layout.tsx test in this repo
// reads it as source text for the same reason), so it pins the function's
// source instead of its module.
import { readFileSync } from 'fs';
import { join } from 'path';

const src = readFileSync(join(__dirname, '..', 'app/_layout.tsx'), 'utf8');

test('the default branch is a short push, not the uncustomizable default preset', () => {
  expect(src).toMatch(/reduceMotion\s*\?\s*'fade'\s*:\s*'simple_push'/);
});

test('both branches use the same existing duration token — no new magic number', () => {
  expect(src).toContain('animationDuration: motion.duration.snap');
  expect(src).not.toMatch(/animationDuration:\s*\d/);
});

test('the Stack actually wires screenAnimation(reduceMotion) into its screenOptions', () => {
  expect(src).toContain('...screenAnimation(reduceMotion)');
});

// PHASE2_ROWS.md row 74 follow-up: onboarding/_layout.tsx now has its own
// Reduce Motion branch too (see onboardingLayoutReduceMotion.render.test.tsx
// for the mounted-component proof of both branches).
test('onboarding/_layout.tsx drops the slide under Reduce Motion, keeps it otherwise', () => {
  const onboarding = readFileSync(join(__dirname, '..', 'app/onboarding/_layout.tsx'), 'utf8');
  expect(onboarding).toMatch(/reduceMotion\s*\?\s*'none'\s*:\s*'slide_from_right'/);
});
