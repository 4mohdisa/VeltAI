// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "web/**", "ds-bundle/**"],
  },
  {
    // PostHog is required lazily so a build without a key never loads it.
    files: ["src/lib/analyticsSink.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": ["warn", { allow: ["^posthog-react-native$"] }],
    },
  },
]);
