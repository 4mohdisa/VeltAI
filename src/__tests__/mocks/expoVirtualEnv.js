// Jest stand-in for expo/virtual/env (ESM in node_modules — babel-preset-expo
// rewrites process.env.EXPO_PUBLIC_* reads to import from it).
module.exports = { env: process.env };
