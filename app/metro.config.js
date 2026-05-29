// Default Expo Metro config. Expo's config resolves the `@/*` tsconfig path
// aliases automatically (SDK 50+).
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
