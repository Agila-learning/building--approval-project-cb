// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure resolution of 'expo' and expo modules from nested package sources (e.g., expo-image-picker/src)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  expo: path.resolve(__dirname, 'node_modules/expo'),
  'expo-modules-core': path.resolve(__dirname, 'node_modules/expo-modules-core'),
};

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
