// expo-constants for the node-env jest project.
//
// The real package is ESM and is not in transformIgnorePatterns, so importing it
// from a node test throws "Cannot use import statement outside a module". It
// reached the node suites when src/lib/analytics.ts began stamping the app
// version and build sha onto every event (src/lib/appVersion.ts).
//
// Fixed values, not the real app.json: a test that asserts an event carries a
// version wants a KNOWN version, and reading the manifest would make the
// expectation move every time the build number is bumped.
const Constants = {
  expoConfig: {
    version: '1.0.0',
    ios: { buildNumber: '1' },
    scheme: 'lume',
    extra: { gitSha: 'testsha0000000000000000000000000000000a', gitDirty: false },
  },
};

export default Constants;
