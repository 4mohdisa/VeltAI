// Metro config — one job beyond the Expo defaults: keep the debug-capture
// system out of production bundles ENTIRELY.
//
// Inlining `process.env.EXPO_PUBLIC_DEBUG_CAPTURE` would let the minifier fold
// away `if (DEBUG_CAPTURE)` branches, but the `require` edges survive, so the
// debug UI, its screenshot dependency and the report store would all still be
// bundled — just unreachable. That is not good enough for a feature that
// captures screenshots of health data and would be a 2.3.1 hidden feature if it
// shipped.
//
// So when the flag is off we resolve `src/debug/impl` (and anything under it) to
// `src/debug/stub.ts` instead. The real tree is then not in the module graph at
// all: nothing imports it, nothing bundles it.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const DEBUG_CAPTURE = process.env.EXPO_PUBLIC_DEBUG_CAPTURE === '1';
const STUB = path.resolve(__dirname, 'src/debug/stub.ts');

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (!DEBUG_CAPTURE && /(^|\/)impl(\/|$)/.test(moduleName) && moduleName.includes('debug')) {
    return { type: 'sourceFile', filePath: STUB };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
