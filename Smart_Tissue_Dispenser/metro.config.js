// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Web compatibility improvements
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add web-specific asset extensions
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

// Handle web-specific source extensions
config.resolver.sourceExts.push('web.js', 'web.jsx', 'web.ts', 'web.tsx');

module.exports = config;
