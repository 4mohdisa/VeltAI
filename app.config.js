// Dynamic Expo config. app.json remains the single source of truth for every
// static field; this file exists only to stamp the build's git SHA into
// `extra`, which a static JSON file cannot do.
//
// Why (2026-08-08): the debug capture system reported `gitSha: null` on every
// report, because nothing ever set EXPO_PUBLIC_GIT_SHA — an in-code comment
// claimed eas.json did, which was false. It is the same defect class as the
// backend's stale `lumoserver`: a build that cannot say which commit it came
// from. The server now stamps itself via Go's VCS build info; this is the app
// half.
//
// EAS Build exports EAS_BUILD_GIT_COMMIT_HASH during a cloud build. Locally,
// git is read directly. Neither is required — an unknown SHA stays null rather
// than inventing a value.
const { execSync } = require('node:child_process');

const base = require('./app.json');

function gitSha() {
  // EAS provides this on cloud builds; it is authoritative there.
  if (process.env.EAS_BUILD_GIT_COMMIT_HASH) return process.env.EAS_BUILD_GIT_COMMIT_HASH;
  // An explicit override always wins (CI systems that are not EAS).
  if (process.env.EXPO_PUBLIC_GIT_SHA) return process.env.EXPO_PUBLIC_GIT_SHA;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    // Not a work tree (a tarball build, say). Null is honest; a placeholder
    // would be exactly the fabricated-provenance problem this fixes.
    return null;
  }
}

function gitDirty() {
  if (process.env.EAS_BUILD_GIT_COMMIT_HASH) return false; // EAS builds from a clean checkout
  try {
    return (
      execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
        .length > 0
    );
  } catch {
    return false;
  }
}

module.exports = () => ({
  ...base.expo,
  extra: {
    ...(base.expo.extra ?? {}),
    gitSha: gitSha(),
    gitDirty: gitDirty(),
  },
});
