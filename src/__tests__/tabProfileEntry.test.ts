// V2 — every tab reaches Profile the same way. The design floats the avatar on
// Summary, Food and Gym; the app had it on Summary only, as an inline copy.
// This fails if a tab drops the shared control or grows its own copy again.
import { readFileSync } from 'fs';
import { join } from 'path';

const tab = (name: string) => readFileSync(join(__dirname, '..', 'app', '(tabs)', `${name}.tsx`), 'utf8');

test.each(['index', 'food', 'gym'])('the %s tab mounts the shared ProfileAvatarButton', (name) => {
  const src = tab(name);
  expect(src).toContain('<ProfileAvatarButton />');
  // No second, hand-rolled way into Profile that could drift from the shared one.
  expect(src).not.toMatch(/router\.push\(\s*['"]\/profile['"]\s*\)/);
});
