// Why Summary still carries the gym status card that the design removes.
//
// The design (SummaryScreen.dc.html) has no "Today's gym session" card, and the
// follow-up pass was asked to remove it — but ONLY if a genuine one-tap log
// exists elsewhere. It does not:
//
//   Summary   GymStatusCard's button calls logGymSession() directly → ONE tap.
//   Gym tab   GymSessionButton pushes /gym/log-session, which opens the sheet;
//             the session is logged by a SECOND tap on the sheet's own pill.
//
// So removing the card would delete the only one-tap log in the app. It stays,
// and this test is the tripwire: if the Gym tab ever grows a direct log, the
// last assertion fails and whoever made that change should revisit removing the
// Summary card (FOLLOWUP_PASS_REPORT.md, item 7).
import { readFileSync } from 'fs';
import { join } from 'path';

const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const summary = code(src('app/(tabs)/index.tsx'));
const gymTab = code(src('app/(tabs)/gym.tsx'));

test('Summary logs a session in one tap', () => {
  expect(summary).toContain('<GymStatusCard');
  expect(summary).toMatch(/logGymSession\(\)/);
});

test('the Gym tab does not: its button opens the sheet', () => {
  expect(gymTab).toContain("router.push('/gym/log-session')");
  expect(gymTab).toContain('<GymSessionButton');
});

// The tripwire. If this fails, a one-tap log now exists on the Gym tab and the
// Summary card can finally go, as the design wants.
test('no second one-tap log exists yet, so the Summary card is still the only one', () => {
  expect(gymTab).not.toMatch(/logGymSession\(/);
});
