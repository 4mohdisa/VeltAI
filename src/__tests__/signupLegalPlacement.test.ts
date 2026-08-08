// Signup legal-link placement (item 2 of the 2026-08-08 follow-ups).
//
// The links used to sit footnote-sized directly beneath the auth buttons,
// where a real session mis-tapped one and landed on the Terms screen
// mid-onboarding. They now render once, in the scaffold's bottom footer slot.
//
// This is a SOURCE assertion, not a render test, and deliberately so: mounting
// SignupScreen pulls in @clerk/clerk-expo and expo-web-browser, whose
// module-scope maybeCompleteAuthSession() never settles under jest. Mocking
// that chain is more scaffolding than this placement rule justifies. The
// measurements screen, which has no such dependency, IS render-tested.
import * as fs from 'fs';
import * as path from 'path';

const src = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'onboarding', 'signup.tsx'),
  'utf8',
);

test('LegalFooter is handed to the scaffold footer slot', () => {
  expect(src).toContain('footer={<LegalFooter />}');
});

test('LegalFooter is rendered exactly once, and not inside an auth-button group', () => {
  const renders = src.split('<LegalFooter />').length - 1;
  expect(renders).toBe(1);
  // The two auth groups (Clerk and dev) must no longer contain it.
  for (const group of ['function ClerkSignup', 'function DevSignup']) {
    const start = src.indexOf(group);
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf('\n}', start));
    expect(body).not.toContain('<LegalFooter />');
  }
});

test('the links keep their hit slop — proximity was the hazard, not target size', () => {
  expect(src).toContain('LINK_HIT_SLOP');
  expect(src).toMatch(/top:\s*14/);
  expect(src).toMatch(/bottom:\s*14/);
});
