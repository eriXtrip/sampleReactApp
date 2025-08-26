// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add ppt/pptx as asset extensions
config.resolver.assetExts.push('ppt', 'pptx', 'pdf', 'mp4');

module.exports = config;
