// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web ships a WebAssembly build (wa-sqlite); allow Metro to
// resolve the .wasm asset so the web/server bundle (used to deploy the
// generation proxy) compiles.
config.resolver.assetExts.push('wasm');

module.exports = config;
