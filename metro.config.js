// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Agregar extensiones de assets
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'svg', 'gif', 'webp');

module.exports = config;