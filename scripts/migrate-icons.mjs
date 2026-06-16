// One-off: migrate Ionicons → the SF-Symbol Icon primitive across the app.
// Swaps the import and the JSX tag; rewrites the ComponentProps<typeof Ionicons>
// type to string; drops the Icon import if a file ended up not using <Icon/>.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync(
  "grep -rl \"@expo/vector-icons\" src --include='*.tsx' --include='*.ts'",
  { encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .filter(Boolean)
  // (tabs)/_layout.tsx is replaced by NativeTabs in R2 — leave it for now.
  .filter((f) => !f.endsWith('(tabs)/_layout.tsx'))
  // StreakFlame uses createAnimatedComponent(Ionicons) — migrate by hand.
  .filter((f) => !f.endsWith('animations/StreakFlame.tsx'));

let changed = 0;
for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const before = src;

  src = src.replace(
    /import\s*\{\s*Ionicons\s*\}\s*from\s*'@expo\/vector-icons';\n/g,
    "import { Icon } from '@/components/primitives/Icon';\n",
  );
  src = src.replace(/React\.ComponentProps<typeof Ionicons>\['name'\]/g, 'string');
  src = src.replace(/ComponentProps<typeof Ionicons>\['name'\]/g, 'string');
  src = src.replace(/<Ionicons\b/g, '<Icon');
  src = src.replace(/\bIonicons\b/g, 'Icon'); // any stragglers (refs)

  // If the file no longer renders <Icon/>, drop the now-unused import.
  if (!/<Icon[\s/>]/.test(src)) {
    src = src.replace(/import\s*\{\s*Icon\s*\}\s*from\s*'@\/components\/primitives\/Icon';\n/g, '');
  }

  if (src !== before) {
    writeFileSync(file, src);
    changed++;
  }
}
console.log(`Migrated ${changed} files.`);
