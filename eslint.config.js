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
  {
    // react-native is required lazily so the node-env Jest suites can import this module.
    files: ["src/lib/ai/consent.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": ["warn", { allow: ["^react-native$"] }],
    },
  },
  {
    // Optional native modules: a static import would crash Expo Go.
    files: ["src/lib/billing/purchases.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": ["warn", { allow: ["^react-native-purchases(-ui)?$"] }],
    },
  },
]);
