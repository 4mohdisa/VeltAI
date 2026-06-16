// One-off: migrate the temporary monochrome compat aliases to explicit tokens,
// so the alias block in tokens.ts can be deleted (R6). Word boundaries ensure
// color.accent never clobbers color.accentText, etc.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync(
  "grep -rlE 'color\\.(accent|accentText|accentDark|accentLight|accentBorder|warn|warnLight|warnBorder|warnText|error|errorLight|errorBorder|streakFire)\\b' src --include='*.tsx' --include='*.ts'",
  { encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .filter(Boolean)
  .filter((f) => !f.endsWith('lib/design/tokens.ts'));

const rules = [
  [/\bcolor\.accentText\b/g, 'color.black'],
  [/\bcolor\.accentDark\b/g, 'color.black'],
  [/\bcolor\.accentBorder\b/g, 'color.gray300'],
  [/\bcolor\.accentLight\b/g, 'color.gray100'],
  [/\bcolor\.accent\b/g, 'color.black'],
  [/\bcolor\.warnText\b/g, 'color.gray700'],
  [/\bcolor\.warnLight\b/g, 'color.gray100'],
  [/\bcolor\.warnBorder\b/g, 'color.gray300'],
  [/\bcolor\.warn\b/g, 'color.black'],
  [/\bcolor\.errorLight\b/g, 'color.gray100'],
  [/\bcolor\.errorBorder\b/g, 'color.gray300'],
  [/\bcolor\.error\b/g, 'color.black'],
  [/\bcolor\.streakFire\b/g, 'color.black'],
];

let changed = 0;
for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const before = src;
  for (const [re, to] of rules) src = src.replace(re, to);
  if (src !== before) {
    writeFileSync(file, src);
    changed++;
  }
}
console.log(`Migrated ${changed} files.`);
