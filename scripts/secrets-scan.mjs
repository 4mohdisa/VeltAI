#!/usr/bin/env node
/**
 * Secrets scan.  `node scripts/secrets-scan.mjs [file ...]`
 *
 * With no arguments it scans every file git would track in the working tree
 * (tracked plus untracked, minus .gitignore'd). With arguments it scans exactly
 * those files. Binary files, lockfiles, node_modules and backend/.env.example
 * are skipped. Findings print as `file:line rule`, never the matched value.
 * Exit code 1 = a finding.
 *
 * No dependencies.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const LOCKFILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'go.sum', 'Podfile.lock']);
const SKIPPED_PATHS = new Set(['backend/.env.example']);

// Each rule's first capture group is the value checked against PLACEHOLDER.
const RULES = [
  { name: 'Clerk secret key', re: /\b(sk_(?:live|test)_\w{20,})/ },
  { name: 'Anthropic key', re: /\b(sk-ant-[\w-]{20,})/ },
  { name: 'Google API key', re: /\b(AIza[\w-]{35})/ },
  { name: 'PEM private key', re: /(-----BEGIN [A-Z ]*PRIVATE KEY-----)/ },
  {
    name: 'secret-named literal',
    // A quoted literal of 16+ characters assigned to a SECRET/PASSWORD/TOKEN/API_KEY
    // name, or the same as an unquoted `NAME=value` env-file line.
    re: /(?:\b\w*(?:SECRET|PASSWORD|TOKEN|API_KEY)\w*["']?\s*[:=]\s*["'`](?!\$\{)([^"'`\s]{16,})["'`]|^\s*(?:export\s+)?\w*(?:SECRET|PASSWORD|TOKEN|API_KEY)\w*=(?!["'`$])(?!process\.env)(\S{16,}))/i,
  },
];

// Values that are visibly not a credential: docs placeholders (an all-caps tail
// such as sk_live_REPLACE_ME), test fixtures built from obvious runs, and URLs.
// ponytail: a heuristic, so a real key containing "123456" would pass; a tighter
// entropy check is the upgrade if that ever matters.
const PLACEHOLDER = /^https?:\/\/|placeholder|example|fake|dummy|not_?real|redact|123456|abcdef|x{6,}/i;
const ALL_CAPS_TAIL = /_[A-Z][A-Z_]*$/;

function realValue(value) {
  return !ALL_CAPS_TAIL.test(value) && !PLACEHOLDER.test(value);
}

function workingTreeFiles() {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\0').filter(Boolean);
}

function skipped(path) {
  return SKIPPED_PATHS.has(path) || LOCKFILES.has(basename(path)) || path.split('/').includes('node_modules');
}

function scanFile(path, absolute) {
  let buf;
  try {
    buf = readFileSync(absolute);
  } catch {
    return [];
  }
  if (buf.subarray(0, 8000).includes(0)) return [];
  const findings = [];
  buf.toString('utf8').split('\n').forEach((line, i) => {
    for (const rule of RULES) {
      const m = rule.re.exec(line);
      const value = m && (m[1] ?? m[2]);
      if (value && realValue(value)) findings.push(`${path}:${i + 1} ${rule.name}`);
    }
  });
  return findings;
}

const args = process.argv.slice(2);
const targets = (args.length > 0 ? args.map((p) => [p, p]) : workingTreeFiles().map((p) => [p, join(ROOT, p)])).filter(
  ([p]) => !skipped(p),
);
const findings = targets.flatMap(([p, abs]) => scanFile(p, abs));

if (findings.length > 0) {
  console.error(`secrets scan: ${findings.length} finding(s)`);
  for (const f of findings) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`secrets scan: ${targets.length} files checked, no findings`);
