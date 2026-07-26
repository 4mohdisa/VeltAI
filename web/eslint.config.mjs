// Flat config using @next/eslint-plugin-next's native flat presets (v16).
// eslint-config-next's FlatCompat path crashes under ESLint 9 (circular
// structure in config serialization) — the plugin's own flat config is the
// supported route and covers core-web-vitals; types are tsc's job.
import next from '@next/eslint-plugin-next';

export default [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'] },
  next.configs['core-web-vitals'],
];
