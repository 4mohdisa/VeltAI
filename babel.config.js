// Canonical Expo babel config. Required by both the Metro bundler and jest-expo's
// babel-jest transform. babel-preset-expo covers expo-router + JSX/TS; the
// worklets plugin (must be last) powers react-native-reanimated 4.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
